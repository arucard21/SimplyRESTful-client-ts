import { OpenAPIV3 } from 'openapi-types';
import { APIResource } from './APIResource';
import { APICollection } from './APICollection';
import { SortOrder } from './SortOrder';
import { BadRequestError, NotFoundError, fromResponse } from './Errors';

export class SimplyRESTfulClient<T extends APIResource> {
	readonly dummyHostname = "placeholderforrelativeurl";
	readonly dummyHost = "http://" + this.dummyHostname;

    readonly baseApiUri: string;
    readonly resourceMediaType: string;
    resourceUriTemplate: string | undefined;
    totalAmountOfLastRetrievedCollection = -1;

    constructor(baseApiUri: string, resourceMediaType: string) {
        this.baseApiUri = baseApiUri;
        this.resourceMediaType = resourceMediaType;
    }

    /*
     Manually set the resource URI template.

     This disables discovering it automatically based on the OpenAPI Specification.
     Changes to the resource URI will not be detected automatically.
     This is only provided as a fallback mechanism, using the discovery mechanism is
     recommended (which happens automatically if this method is never used).
     */
    setResourceUriTemplate(resourceUriTemplate: string) {
        this.resourceUriTemplate = resourceUriTemplate;
    }

    async discoverApi(httpHeaders?: Headers): Promise<void> {
        if (this.resourceUriTemplate) {
            return;
        }
        return this.retrieveServiceDocument(httpHeaders)
            .then(openApiSpecificationUrl => this.retrieveOpenApiSpecification(openApiSpecificationUrl, httpHeaders))
            .then(openApiSpecification => this.configureResourceUriTemplate(openApiSpecification));
    }

    private async retrieveServiceDocument(this: this, httpHeaders?: Headers): Promise<string> {
        return fetch(this.baseApiUri, { headers: httpHeaders }).then(async response => {
            if (!response.ok) {
				return response.text().then(body => {
					throw fromResponse(
						response,
						new Error(`The client could not access the API at ${this.baseApiUri}.\nThe API returned status ${response.status} with message:\n${body}`));
				});
            }
            return response.json().then(serviceDocument => {
                return serviceDocument["describedBy"]["href"];
            })
        });
    }

    private async retrieveOpenApiSpecification(openApiSpecificationUrl: string, httpHeaders?: Headers): Promise<OpenAPIV3.Document> {
        return fetch(openApiSpecificationUrl, { headers: httpHeaders }).then(async response => {
            if (!response.ok) {
				return response.text().then(body => {
					throw fromResponse(
						response,
						new Error(`The client could not retrieve the OpenAPI Specification document at ${openApiSpecificationUrl}.\nThe API returned status ${response.status} with message:\n${body}`));
				});
            }
            return response.json().then((openApiSpecification: OpenAPIV3.Document) => openApiSpecification);
        });
    }

    private async configureResourceUriTemplate(this: this, openApiSpecification: OpenAPIV3.Document): Promise<void> {
        for (const [discoveredPath, pathItem] of Object.entries(openApiSpecification.paths)) {
			if(!pathItem){
				continue;
			}
			const responses = (pathItem.get?.responses as OpenAPIV3.ResponsesObject);
			for(const responseIndex in responses){
				if(responseIndex == "default" || (parseInt(responseIndex) >= 200 && parseInt(responseIndex) < 300)){
					const response = responses[responseIndex] as OpenAPIV3.ResponseObject
					for (const contentType in response.content) {
						const contentTypeNoSpaces = contentType.replace(" ", "");
						if (contentTypeNoSpaces === this.resourceMediaType) {
							const resourceUri : URL = this.createUrlFromRelativeOrAbsoluteUrlString(this.baseApiUri);
							resourceUri.pathname = this.joinPath(resourceUri.pathname, discoveredPath);
							this.resourceUriTemplate = decodeURI(this.getRelativeOrAbsoluteUrl(resourceUri));
							return;
						}
					}
				}
			}
        }
	}

	async list({pageStart, pageSize, fields, query, sort, httpHeaders, additionalQueryParameters} : {pageStart?: number, pageSize?: number, fields?: string[], query?: string, sort?: SortOrder[], httpHeaders?: Headers, additionalQueryParameters?: URLSearchParams} = {}): Promise<T[]> {
        return this.discoverApi(httpHeaders).then(() => {
            const resourceListUri = this.createUrlFromRelativeOrAbsoluteUrlString(this.resolveResourceUriTemplate());

            const searchParams = new URLSearchParams();
            if (pageStart) {
                searchParams.append("pageStart", pageStart.toString());
            }
            if (pageSize) {
                searchParams.append("pageSize", pageSize.toString());
            }
            if (fields) {
                searchParams.append("fields", fields.join(","));
            }
            if (query) {
                searchParams.append("query", query);
            }
            if (sort) {
                const sortParameters: string[] = [];
                sort.forEach(field => {
                    sortParameters.push(`${field.fieldName}:${field.ascending ? "asc" : "desc"}`);
                });
                searchParams.append("sort", sortParameters.join(","));
            }
            if (additionalQueryParameters) {
                additionalQueryParameters.forEach((paramValue, paramName) => {
                    searchParams.append(paramName, paramValue);
                });
            }
            resourceListUri.search = searchParams.toString();

            if (!httpHeaders) {
                httpHeaders = new Headers();
            }
            httpHeaders.append("Accept", "application/x.simplyrestful-collection-v1+json");

            return fetch(this.getRelativeOrAbsoluteUrl(resourceListUri), { headers: httpHeaders }).then(response => {
                if (!response.ok) {
					return response.text().then(body => {
						throw fromResponse(
							response,
							new Error(`Failed to list the resource at ${resourceListUri}.\nThe API returned status ${response.status} with message:\n${body}`));
					});
                }
                return response.json() as Promise<APICollection<T>>;
            }).then((collection: APICollection<T>) => {
                this.totalAmountOfLastRetrievedCollection = typeof collection.total === 'number' ? collection.total : -1;
                if (!collection.item) {
                    return [];
                }
                return collection.item;
            })
        });
    }

    async create(resource: T, httpHeaders?: Headers, queryParameters?: URLSearchParams): Promise<string> {
        return this.discoverApi(httpHeaders).then(() => {
            const resourceListUri = this.createUrlFromRelativeOrAbsoluteUrlString(this.resolveResourceUriTemplate());
            if (queryParameters) {
                resourceListUri.search = queryParameters.toString();
            }

            if (!httpHeaders) {
                httpHeaders = new Headers();
            }
            httpHeaders.append("Content-Type", this.resourceMediaType);

            return fetch(this.getRelativeOrAbsoluteUrl(resourceListUri), { method: "POST", headers: httpHeaders, body: JSON.stringify(resource) }).then(response => {
                if (response.status !== 201) {
					return response.text().then(body => {
						throw fromResponse(
							response,
							new Error(`Failed to create the new resource.\nThe API returned status ${response.status} with message:\n${body}`));
					});
                }
                const locationOfCreatedResource = response.headers.get("Location");
                if (!locationOfCreatedResource) {
                    throw new Error("Resource seems to have been created but no location was returned. Please report this to the maintainers of the API");
                }
                return locationOfCreatedResource;
            });
        });
    }

    async read(resourceIdentifier: string, httpHeaders?: Headers, queryParameters?: URLSearchParams): Promise<T> {
        return this.discoverApi(httpHeaders).then(() => {
			const resourceUri = this.createUrlFromRelativeOrAbsoluteUrlString(resourceIdentifier);
            if (queryParameters) {
                resourceUri.search = queryParameters.toString();
            }

            if (!httpHeaders) {
                httpHeaders = new Headers();
            }
            httpHeaders.append("Accept", this.resourceMediaType);

            return fetch(this.getRelativeOrAbsoluteUrl(resourceUri), { headers: httpHeaders }).then(response => {
                if (!response.ok) {
					return response.text().then(body => {
						throw fromResponse(
							response,
							new Error(`Failed to read the resource at ${resourceIdentifier}.\nThe API returned status ${response.status} with message:\n${body}`));
					});
                }
				return response.json() as Promise<T>;
            });
        });
    }

    async update(resource: T, httpHeaders?: Headers, queryParameters?: URLSearchParams): Promise<void> {
        return this.discoverApi(httpHeaders).then(() => {
            const selfLink = resource?.self?.href;
            if (!selfLink) {
                throw new BadRequestError(undefined, new Error("The update failed because the resource does not contain a valid self link."));
            }
            const resourceIdentifier: URL = this.createUrlFromRelativeOrAbsoluteUrlString(selfLink);
            if (queryParameters) {
                resourceIdentifier.search = queryParameters.toString();
            }

            if (!httpHeaders) {
                httpHeaders = new Headers();
            }
            httpHeaders.append("Content-Type", this.resourceMediaType);

			const uri : string = this.getRelativeOrAbsoluteUrl(resourceIdentifier);
            return fetch(uri, { method: "PUT", headers: httpHeaders, body: JSON.stringify(resource) }).then(response => {
                if (!response.ok) {

                    if (response.status === 404) {
                        throw new NotFoundError(undefined, new Error(`Resource at ${uri} could not be found`), response);
					}
					return response.text().then(body => {
						throw fromResponse(
							response,
							new Error(`Failed to update the resource at ${uri}.\nThe API returned status ${response.status} with message:\n${body}`));
					});
                }
            })
        });
    }

    async delete(resourceIdentifier: string, httpHeaders?: Headers, queryParameters?: URLSearchParams) : Promise<boolean> {
        return this.discoverApi(httpHeaders).then(() => {
			const resourceUri = this.createUrlFromRelativeOrAbsoluteUrlString(resourceIdentifier);
            if (queryParameters) {
                resourceUri.search = queryParameters.toString();
            }

            if (!httpHeaders) {
                httpHeaders = new Headers();
            }

            return fetch(this.getRelativeOrAbsoluteUrl(resourceUri), { method: "DELETE", headers: httpHeaders }).then(response => {
                if (response.status !== 204) {
                    if (response.status === 404) {
                        throw new NotFoundError(undefined, new Error(`Resource at ${resourceIdentifier} could not be found`));
					}
					return response.text().then(body => {
						throw fromResponse(
							response,
							new Error(`Failed to delete the resource at ${resourceIdentifier}.\nThe API returned status ${response.status} with message:\n${body}`));
					});
				}
				else {
					return true;
				}
            })
        });
    }

    async readWithUuid(resourceUuid: string, httpHeaders?: Headers, queryParameters?: URLSearchParams): Promise<T> {
        return this.discoverApi(httpHeaders).then(() => {
            const resourceUri = this.resolveResourceUriTemplate(resourceUuid);
            return this.read(resourceUri, httpHeaders, queryParameters);
        });
    }

    async deleteWithUuid(resourceUuid: string, httpHeaders?: Headers, queryParameters?: URLSearchParams): Promise<boolean> {
        return this.discoverApi(httpHeaders).then(() => {
            const resourceUri = this.resolveResourceUriTemplate(resourceUuid);
            return this.delete(resourceUri, httpHeaders, queryParameters);
        });
    }

    private resolveResourceUriTemplate(resourceUuid?: string): string {
        if (!this.resourceUriTemplate) {
            throw new Error("The client needs to discover the resource URI template from the API before this method can be used. Use discoverApi() first.");
        }
        if (!resourceUuid) {
            return this.resourceUriTemplate.replace(/{id}/, "");
        }
        return this.resourceUriTemplate.replace(/{id}/, resourceUuid);
	}

	private joinPath(basePath: string, joinPath: string) : string {
		if(joinPath.startsWith('/')){
			joinPath = joinPath.slice(1);
		}
		if(basePath.endsWith('/')){
			return basePath + joinPath;
		}
		else{
			return basePath + '/' + joinPath;
		}
	}

	private createUrlFromRelativeOrAbsoluteUrlString(url: string) : URL {
		return new URL(url, this.dummyHost);
	}

	private getRelativeOrAbsoluteUrl(url: URL) : string {
		if(url.hostname === this.dummyHostname){
			return url.pathname + url.search;
		}
		return url.toString();
	}
}
