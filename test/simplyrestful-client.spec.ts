import { SimplyRESTfulClient } from '../src/simplyrestful-client';
import { TestResource } from './TestResource';
import fetchMock from 'jest-fetch-mock';
import { InternalServerError, BadRequestError, NotFoundError, BadGatewayError, ForbiddenError, NotAcceptableError, NotSupportedError } from '../src/Errors';

let testResourceClient: SimplyRESTfulClient<TestResource>;
const baseUri = "http://localhost/";
const testResourceMediaType = "application/x.testresource-v1+json";

beforeAll(() => {
    fetchMock.enableMocks();
    testResourceClient = new SimplyRESTfulClient(baseUri, testResourceMediaType);
    testResourceClient.setResourceUriTemplate("http://localhost/testresources/{id}");
});

beforeEach(() => {
    fetchMock.resetMocks();
});

test('discoverApi correctly discovers the resource URI for this resource', async () => {
    const openApiUri = "http://localhost/openapi.json";
    const testResourceClientWithDiscovery = new SimplyRESTfulClient(baseUri, testResourceMediaType);
    fetchMock.mockResponses(
        [
            JSON.stringify({
                describedBy: {
					href: openApiUri
				}
            }),
            { status: 200 }
        ],
        [
            JSON.stringify({
                paths: {
                    "/discoveredtestresources/{id}": {
                        get: {
                            responses: {
                                default: {
                                    content: {
                                        [testResourceMediaType]: {
                                            schema: {}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            { status: 200 }
        ]);
    await testResourceClientWithDiscovery.discoverApi();
    expect(testResourceClientWithDiscovery.resourceUriTemplate).toBe("http://localhost/discoveredtestresources/{id}");
    expect(fetchMock.mock.calls[0][0]).toBe(baseUri);
    expect(fetchMock.mock.calls[1][0]).toBe(openApiUri);
});

test('discoverApi correctly discovers the resource URI for this resource when the API base URI is relative', async () => {
	const relativeBaseUri = "";
	const openApiUri = "http://localhost/openapi.json";
    const testResourceClientWithDiscovery = new SimplyRESTfulClient(relativeBaseUri, testResourceMediaType);
    fetchMock.mockResponses(
        [
            JSON.stringify({
				describedBy: {
					href: openApiUri
				}
            }),
            { status: 200 }
        ],
        [
            JSON.stringify({
                paths: {
                    "/discoveredtestresources/{id}": {
                        get: {
                            responses: {
                                default: {
                                    content: {
                                        [testResourceMediaType]: {
                                            schema: {}
                                        }
                                    }
                                },
                            }
                        }
                    }
                }
            }),
            { status: 200 }
        ]);
    await testResourceClientWithDiscovery.discoverApi();
    expect(testResourceClientWithDiscovery.resourceUriTemplate).toBe("/discoveredtestresources/{id}");
    expect(fetchMock.mock.calls[0][0]).toBe(relativeBaseUri);
    expect(fetchMock.mock.calls[1][0]).toBe(openApiUri);
});

test('discoverApi correctly discovers the resource URI for this resource when the API root has a base path', async () => {
	const baseUriWithBasePath = "http://localhost/some/base/path/";
    const openApiUri = "http://localhost/some/base/path/openapi.json";
    const testResourceClientWithDiscovery = new SimplyRESTfulClient(baseUriWithBasePath, testResourceMediaType);
    fetchMock.mockResponses(
        [
            JSON.stringify({
				describedBy: {
					href: openApiUri
				}
            }),
            { status: 200 }
        ],
        [
            JSON.stringify({
                paths: {
                    "/discoveredtestresources/{id}": {
                        get: {
                            responses: {
                                default: {
                                    content: {
										[testResourceMediaType]: {
                                            schema: {}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            { status: 200 }
        ]);
    await testResourceClientWithDiscovery.discoverApi();
    expect(testResourceClientWithDiscovery.resourceUriTemplate).toBe("http://localhost/some/base/path/discoveredtestresources/{id}");
    expect(fetchMock.mock.calls[0][0]).toBe(baseUriWithBasePath);
    expect(fetchMock.mock.calls[1][0]).toBe(openApiUri);
});

test('discoverApi correctly discovers the resource URI for this resource when the API root has a base path and the API base URI is relative', async () => {
	const relativeBaseUriWithBasePath = "some/base/path/";
    const openApiUri = "http://localhost/some/base/path/openapi.json";
    const testResourceClientWithDiscovery = new SimplyRESTfulClient(relativeBaseUriWithBasePath, testResourceMediaType);
    fetchMock.mockResponses(
        [
            JSON.stringify({
				describedBy: {
					href: openApiUri
				}
            }),
            { status: 200 }
        ],
        [
            JSON.stringify({
                paths: {
                    "/discoveredtestresources/{id}": {
                        get: {
                            responses: {
                                default: {
                                    content: {
                                        [testResourceMediaType]: {
                                            schema: {}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            { status: 200 }
        ]);
    await testResourceClientWithDiscovery.discoverApi();
    expect(testResourceClientWithDiscovery.resourceUriTemplate).toBe("/some/base/path/discoveredtestresources/{id}");
    expect(fetchMock.mock.calls[0][0]).toBe(relativeBaseUriWithBasePath);
    expect(fetchMock.mock.calls[1][0]).toBe(openApiUri);
});

test('discoverApi correctly discovers the resource URI for this resource when the media type is for a 2xx response instead of default', async () => {
	const relativeBaseUri = "";
	const openApiUri = "http://localhost/openapi.json";
    const testResourceClientWithDiscovery = new SimplyRESTfulClient(relativeBaseUri, testResourceMediaType);
    fetchMock.mockResponses(
        [
            JSON.stringify({
				describedBy: {
					href: openApiUri
				}
            }),
            { status: 200 }
        ],
        [
            JSON.stringify({
                paths: {
                    "/discoveredtestresources/{id}": {
                        get: {
                            responses: {
                                200: {
                                    content: {
                                        "application/x.testresource-v1+json": {
                                            schema: {}
                                        }
                                    }
                                },
                            }
                        }
                    }
                }
            }),
            { status: 200 }
        ]);
    await testResourceClientWithDiscovery.discoverApi();
    expect(testResourceClientWithDiscovery.resourceUriTemplate).toBe("/discoveredtestresources/{id}");
    expect(fetchMock.mock.calls[0][0]).toBe(relativeBaseUri);
    expect(fetchMock.mock.calls[1][0]).toBe(openApiUri);
});

test('discoverApi does not discover the resource URI for this resource when the media type is only for a 4xx response', async () => {
	const relativeBaseUri = "";
	const openApiUri = "http://localhost/openapi.json";
    const testResourceClientWithDiscovery = new SimplyRESTfulClient(relativeBaseUri, testResourceMediaType);
    fetchMock.mockResponses(
        [
            JSON.stringify({
				describedBy: {
					href: openApiUri
				}
            }),
            { status: 200 }
        ],
        [
            JSON.stringify({
                paths: {
                    "/discoveredtestresources/{id}": {
                        get: {
                            responses: {
                                400: {
                                    content: {
                                        "application/x.testresource-v1+json": {
                                            schema: {}
                                        }
                                    }
                                },
                            }
                        }
                    }
                }
            }),
            { status: 200 }
        ]);
    await testResourceClientWithDiscovery.discoverApi();
    expect(testResourceClientWithDiscovery.resourceUriTemplate).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(relativeBaseUri);
    expect(fetchMock.mock.calls[1][0]).toBe(openApiUri);
});

test('discoverApi throws an error when the API can not be accessed', async () => {
	const errorStatus = 500;
	const errorResponseBody = 'Something went wrong';
    const testResourceClientWithDiscovery = new SimplyRESTfulClient(baseUri, testResourceMediaType);
	fetchMock.mockResponseOnce(errorResponseBody, { status: errorStatus });
	expect.assertions(4);
	try {
		await testResourceClientWithDiscovery.discoverApi()
	}
	catch(error) {
		expect(error).toBeInstanceOf(InternalServerError);
		expect(error.status).toBe(errorStatus);
		expect(error.cause.message).toBe(`The client could not access the API at ${baseUri}.\nThe API returned status ${errorStatus} with message:\n${errorResponseBody}`);
	}
    expect(fetchMock.mock.calls[0][0]).toBe(baseUri);
});

test('discoverApi throws an error when the OpenAPI Specification URI can not be accessed', async () => {
	const errorStatus = 502;
	const errorResponseBody = 'Something went wrong';
    const openApiUri = "http://localhost/openapi.json";
    const testResourceClientWithDiscovery = new SimplyRESTfulClient(baseUri, testResourceMediaType);
    fetchMock.mockResponses(
        [
            JSON.stringify({
				describedBy: {
					href: openApiUri
				}
            }),
            { status: 200 }
        ],
        [
            errorResponseBody, { status: errorStatus }
		]);
	expect.assertions(5);
	try {
		await testResourceClientWithDiscovery.discoverApi()
	}
	catch(error) {
		expect(error).toBeInstanceOf(BadGatewayError);
		expect(error.status).toBe(errorStatus);
		expect(error.cause.message).toBe(`The client could not retrieve the OpenAPI Specification document at ${openApiUri}.\nThe API returned status ${errorStatus} with message:\n${errorResponseBody}`);
	}
    expect(fetchMock.mock.calls[0][0]).toBe(baseUri);
    expect(fetchMock.mock.calls[1][0]).toBe(openApiUri);
});

test('list correctly retrieves the list of resources', async () => {
    const total = 17;
    const selfLink0 = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
    const selfLink1 = "http://localhost/testresources/00000000-0000-0000-0000-000000000001";
    const selfLink2 = "http://localhost/testresources/00000000-0000-0000-0000-000000000002";
    const additionalFieldValue0 = "test value 0";
    const additionalFieldValue1 = "test value 1";
    const additionalFieldValue2 = "test value 2";
    const item0 = { self: { href: selfLink0 }, additionalField: additionalFieldValue0 };
    const item1 = { self: { href: selfLink1 }, additionalField: additionalFieldValue1 };
    const item2 = { self: { href: selfLink2 }, additionalField: additionalFieldValue2 };

    fetchMock.mockResponse(JSON.stringify(
        {
            total: total,
            item: [item0, item1, item2]
        }));
    expect(testResourceClient.totalAmountOfLastRetrievedCollection).toBe(-1);
    const retrievedListOfResources: TestResource[] = await testResourceClient.list();

    expect(testResourceClient.totalAmountOfLastRetrievedCollection).toBe(total);
    expect(retrievedListOfResources).toContainEqual(item0);
    expect(retrievedListOfResources).toContainEqual(item1);
    expect(retrievedListOfResources).toContainEqual(item2);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost/testresources/");
});

test('list correctly retrieves the list of resources when the collection is empty', async () => {
    const total = 0;

    fetchMock.mockResponse(JSON.stringify(
        {
            total: total,
            item: []
        }));
    const retrievedListOfResources: TestResource[] = await testResourceClient.list();

    expect(testResourceClient.totalAmountOfLastRetrievedCollection).toBe(total);
	expect(fetchMock.mock.calls[0][0]).toBe("http://localhost/testresources/");
	expect(retrievedListOfResources.length).toBe(0);
});

test('list correctly sets the paging query parameters', async () => {
    const resourceListUri = "http://localhost/testresources/";
    const pageStart = 10;
    const pageSize = 100;
    const fields = ["fieldA", "fieldB"];
    const query = "fieldA==valueA,(fieldB==ValueB;fieldB==ValueC)";
    const sort = [{ fieldName: "fieldA", ascending: true }, { fieldName: "fieldD", ascending: false }];
    const additional = new URLSearchParams({ "param1": "value1", "param2": "value2" });

    fetchMock.mockResponse(JSON.stringify({}));
    await testResourceClient.list({pageStart: pageStart, pageSize: pageSize, fields: fields, query: query, sort: sort, additionalQueryParameters: additional});

    const actualUri = fetchMock.mock.calls[0][0] as string;
    expect(actualUri).toContain(resourceListUri);
    const actualSearchParams: URLSearchParams = new URL(actualUri).searchParams;
	expect(actualSearchParams.has("pageStart")).toBeTruthy();
	const actualPageStart = actualSearchParams.get("pageStart");
    expect(actualPageStart).not.toBeNull();
	if(actualPageStart != null){
		expect(parseInt(actualPageStart)).toEqual(pageStart);
	}
	expect(actualSearchParams.has("pageSize")).toBeTruthy();
	const actualPageSize = actualSearchParams.get("pageSize");
	if(actualPageSize != null){
		expect(parseInt(actualPageSize)).toEqual(pageSize);
	}
    expect(actualSearchParams.has("fields")).toBeTruthy();
    expect(actualSearchParams.get("fields")).toBe(fields.join(","));
    expect(actualSearchParams.has("query")).toBeTruthy();
    expect(actualSearchParams.get("query")).toBe(query);
    expect(actualSearchParams.has("sort")).toBeTruthy();
    expect(actualSearchParams.get("sort")).toBe("fieldA:asc,fieldD:desc");
    expect(actualSearchParams.has("param1")).toBeTruthy();
    expect(actualSearchParams.get("param1")).toBe("value1");
    expect(actualSearchParams.has("param2")).toBeTruthy();
    expect(actualSearchParams.get("param2")).toBe("value2");
});

test('list correctly sets the paging query parameters when a relative base API URI is provided', async () => {
	const resourceListUri = "/testrelativeresources/";
	const relativeApiUri = "";
	const clientWithRelativeUri = new SimplyRESTfulClient(relativeApiUri, testResourceMediaType);
	clientWithRelativeUri.setResourceUriTemplate("/testrelativeresources/{id}");

    const pageStart = 10;
    const pageSize = 100;
    const fields = ["fieldA", "fieldB"];
    const query = "fieldA==valueA,(fieldB==ValueB;fieldB==ValueC)";
    const sort = [{ fieldName: "fieldA", ascending: true }, { fieldName: "fieldD", ascending: false }];
    const additional = new URLSearchParams({ "param1": "value1", "param2": "value2" });

    fetchMock.mockResponse(JSON.stringify({}));
    await clientWithRelativeUri.list({pageStart: pageStart, pageSize: pageSize, fields: fields, query: query, sort: sort, additionalQueryParameters: additional});

	const actualUri : string = fetchMock.mock.calls[0][0] as string;
	const actualUrl = new URL(actualUri, 'http://placeholderforrelativeurl')
	expect(actualUrl.pathname).toBe(resourceListUri);
    const actualSearchParams: URLSearchParams = actualUrl.searchParams;
    expect(actualSearchParams.has("pageStart")).toBeTruthy();
	const actualPageStart = actualSearchParams.get("pageStart");
    expect(actualPageStart).not.toBeNull();
	if(actualPageStart != null){
		expect(parseInt(actualPageStart)).toEqual(pageStart);
	}
	expect(actualSearchParams.has("pageSize")).toBeTruthy();
	const actualPageSize = actualSearchParams.get("pageSize");
	if(actualPageSize != null){
		expect(parseInt(actualPageSize)).toEqual(pageSize);
	}
    expect(actualSearchParams.has("fields")).toBeTruthy();
    expect(actualSearchParams.get("fields")).toBe(fields.join(","));
    expect(actualSearchParams.has("query")).toBeTruthy();
    expect(actualSearchParams.get("query")).toBe(query);
    expect(actualSearchParams.has("sort")).toBeTruthy();
    expect(actualSearchParams.get("sort")).toBe("fieldA:asc,fieldD:desc");
    expect(actualSearchParams.has("param1")).toBeTruthy();
    expect(actualSearchParams.get("param1")).toBe("value1");
    expect(actualSearchParams.has("param2")).toBeTruthy();
    expect(actualSearchParams.get("param2")).toBe("value2");
});

test('list correctly sets the HTTP headers', async () => {
    const headers = new Headers({ "header1": "value1", "header2": "value2" });
    const expectedHeaders = new Headers({ "header1": "value1", "header2": "value2", "Accept": "application/x.simplyrestful-collection-v1+json" });
    fetchMock.mockResponse(JSON.stringify({}));
    await testResourceClient.list({httpHeaders: headers});
    expect(fetchMock.mock.calls[0][1]).toHaveProperty("headers", expectedHeaders);
});

test('list throws an error when a bad request is made (HTTP 400 status)', async () => {
	const errorStatus = 400;
	const errorResponseBody = 'Something went wrong';
	fetchMock.mockResponse(errorResponseBody, { status: errorStatus });
	expect.assertions(3);
	try {
		await testResourceClient.list()
	}
	catch(error) {
		expect(error).toBeInstanceOf(BadRequestError);
		expect(error.status).toBe(errorStatus);
		expect(error.cause.message).toBe(`Failed to list the resource at ${baseUri}testresources/.\nThe API returned status ${errorStatus} with message:\n${errorResponseBody}`);
	}
});

test('create correctly creates the resource', async () => {
    const selfLink = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
    const additionalFieldValue = "test value";
    fetchMock.mockResponse("", { status: 201, headers: { Location: selfLink } });
    const newResource: TestResource = { additionalField: additionalFieldValue };
    const newResourceUri: string = await testResourceClient.create(newResource);
    expect(newResourceUri).toBe(selfLink);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost/testresources/");
});

test('create throws an error when a bad request is made (HTTP 403 status)', async () => {
	const errorStatus = 403;
	const errorResponseBody = 'Something went wrong';
	fetchMock.mockResponse(errorResponseBody, { status: errorStatus });
	expect.assertions(3);
	try {
		await testResourceClient.create({});
	}
	catch(error) {
		expect(error).toBeInstanceOf(ForbiddenError);
		expect(error.status).toBe(errorStatus);
		expect(error.cause.message).toBe(`Failed to create the new resource.\nThe API returned status ${errorStatus} with message:\n${errorResponseBody}`);
	}
});

test('create throws an error when the location is not returned', async () => {
    fetchMock.mockResponse("", { status: 201 });
    await expect(testResourceClient.create({})).rejects.toThrow(
		"Resource seems to have been created but no location was returned. Please report this to the maintainers of the API");
});

test('read correctly retrieves the resource when provided with a URL', async () => {
    const selfLink = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
    const additionalFieldValue = "test value";
    fetchMock.mockResponse(JSON.stringify({ self: { href: selfLink }, additionalField: additionalFieldValue}));
    const retrievedResource: TestResource = await testResourceClient.read("http://localhost/testresources/00000000-0000-0000-0000-000000000000");
	expect(retrievedResource.additionalField).toBe(additionalFieldValue);
    expect(retrievedResource.self?.href).toBe(selfLink);
});

test('readWithUuid correctly retrieves the resource when provided with a UUID', async () => {
    const selfLink = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
    const additionalFieldValue = "test value";
    fetchMock.mockResponse(JSON.stringify({ self: { href: selfLink }, additionalField: additionalFieldValue }));
    const retrievedResource: TestResource = await testResourceClient.readWithUuid("00000000-0000-0000-0000-000000000000");
    expect(retrievedResource.additionalField).toBe(additionalFieldValue);
    expect(retrievedResource.self?.href).toBe(selfLink);
});

test('read throws an error when a bad request is made (HTTP 404 status)', async () => {
	const errorStatus = 404;
	const errorResponseBody = 'Something went wrong';
    const resourceUri = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
	fetchMock.mockResponse(errorResponseBody, { status: errorStatus });
	expect.assertions(4);
	try {
		await testResourceClient.read(resourceUri)
	}
	catch(error) {
		expect(error).toBeInstanceOf(NotFoundError);
		expect(error.status).toBe(errorStatus);
		expect(error.cause.message).toBe(`Failed to read the resource at ${resourceUri}.\nThe API returned status ${errorStatus} with message:\n${errorResponseBody}`);
	}
    expect(fetchMock.mock.calls[0][0]).toBe(resourceUri);
});

test('read correctly retrieves the resource and correctly deserializes the JSON string data type property', async () => {
    const selfLink = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
    const additionalFieldValue = "test value";
    fetchMock.mockResponse(JSON.stringify({ self: { href: selfLink }, additionalField: additionalFieldValue, someNumber: 42, someDate: '2021-01-01T09:00:00Z' }));
    const retrievedResource: TestResource = await testResourceClient.read("http://localhost/testresources/00000000-0000-0000-0000-000000000000");
	expect(typeof retrievedResource.additionalField).toBe('string');
	expect(retrievedResource.additionalField).toBe(additionalFieldValue);
	expect(retrievedResource.self?.href).toBe(selfLink);
});

test('read correctly retrieves the resource and correctly deserializes the JSON string number type property', async () => {
    const selfLink = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
    const additionalFieldValue = "test value";
    fetchMock.mockResponse(JSON.stringify({ self: { href: selfLink }, additionalField: additionalFieldValue, someNumber: 42, someDate: '2021-01-01T09:00:00Z' }));
    const retrievedResource: TestResource = await testResourceClient.read("http://localhost/testresources/00000000-0000-0000-0000-000000000000");
	expect(typeof retrievedResource.someNumber).toBe('number');
	expect(retrievedResource.someNumber).toBe(42);
	expect(retrievedResource.self?.href).toBe(selfLink);
});

test('read correctly retrieves the resource but does not deserialize the non-JSON data type property Date', async () => {
    const selfLink = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
    const additionalFieldValue = "test value";
    fetchMock.mockResponse(JSON.stringify({ self: { href: selfLink }, additionalField: additionalFieldValue, someNumber: 42, someDate: '2021-01-01T09:00:00Z' }));
    const retrievedResource: TestResource = await testResourceClient.read("http://localhost/testresources/00000000-0000-0000-0000-000000000000");
	expect(retrievedResource.additionalField).toBe(additionalFieldValue);
	expect(typeof retrievedResource.someDate).not.toBe('Date');
	expect(typeof retrievedResource.someDate).toBe('string');
	expect(retrievedResource.someDate).toBe('2021-01-01T09:00:00Z');
	expect(retrievedResource.self?.href).toBe(selfLink);
});

test('update correctly updates the resource', async () => {
	const selfLink = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
	const otherLink = "http://localhost/to/some/other/place";
    const additionalFieldValue = "test value";
    fetchMock.mockResponse("", { status: 201, headers: { Location: selfLink } });
    const newResource: TestResource = { self: { href: selfLink}, someLink: {href: otherLink }, additionalField: additionalFieldValue }
    await expect(testResourceClient.update(newResource)).resolves.not.toThrow();
    const expectedHeaders = new Headers({ "Content-Type": testResourceMediaType });
    expect(fetchMock.mock.calls[0][0]).toBe(selfLink);
    expect(fetchMock.mock.calls[0][1]).toHaveProperty("headers", expectedHeaders);
});

test('update throws an error when a bad request is made (HTTP 415 status)', async () => {
	const errorStatus = 415;
	const errorResponseBody = 'Something went wrong';
    const resourceUri = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
	fetchMock.mockResponse(errorResponseBody, { status: errorStatus });
	expect.assertions(4);
	try {
		await testResourceClient.update({ self: { href: resourceUri } });
	}
	catch(error){
		expect(error).toBeInstanceOf(NotSupportedError);
		expect(error.status).toBe(errorStatus);
		expect(error.cause.message).toBe(`Failed to update the resource at ${resourceUri}.\nThe API returned status ${errorStatus} with message:\n${errorResponseBody}`);
	}
    expect(fetchMock.mock.calls[0][0]).toBe(resourceUri);
});

test('update throws an error when the resource can not be found (HTTP 404 status)', async () => {
	const resourceUri = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
	const errorStatus = 404;
	fetchMock.mockResponse("", { status: errorStatus });
	expect.assertions(4);
	try {
		await testResourceClient.update({ self: { href: resourceUri } })
	}
	catch(error){
		expect(error).toBeInstanceOf(NotFoundError);
		expect(error.status).toBe(errorStatus);
		expect(error.cause.message).toContain(" could not be found");
	}
    expect(fetchMock.mock.calls[0][0]).toBe(resourceUri);
});

test('delete correctly deletes the resource when provided with a URL', async () => {
    const selfLink = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
    fetchMock.mockResponse("", { status: 204, headers: { Location: selfLink } });
    await expect(testResourceClient.delete(selfLink)).resolves.not.toThrow();
    expect(fetchMock.mock.calls[0][0]).toBe(selfLink);
});

test('deleteWithUuid correctly deletes the resource when provided with a UUID', async () => {
    const selfLink = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
    fetchMock.mockResponse("", { status: 204, headers: { Location: selfLink } });
    await expect(testResourceClient.deleteWithUuid("00000000-0000-0000-0000-000000000000")).resolves.not.toThrow();
    expect(fetchMock.mock.calls[0][0]).toBe(selfLink);
});

test('delete throws an error when a bad request is made (HTTP 406 status)', async () => {
	const errorStatus = 406;
	const errorResponseBody = 'Something went wrong';
    const resourceUri = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
	fetchMock.mockResponse(errorResponseBody, { status: errorStatus });
	expect.assertions(4);
	try {
		await testResourceClient.delete(resourceUri);
	}
	catch(error) {
		expect(error).toBeInstanceOf(NotAcceptableError);
		expect(error.status).toBe(errorStatus);
		expect(error.cause.message).toBe(`Failed to delete the resource at ${resourceUri}.\nThe API returned status ${errorStatus} with message:\n${errorResponseBody}`);
	}
    expect(fetchMock.mock.calls[0][0]).toBe(resourceUri);
});

test('delete throws an error when the resource can not be found (HTTP 404 status)', async () => {
	const errorStatus = 404;
    const resourceUri = "http://localhost/testresources/00000000-0000-0000-0000-000000000000";
	fetchMock.mockResponse("", { status: errorStatus });
	expect.assertions(4);
	try {
		await testResourceClient.delete(resourceUri)
	}
	catch(error){
		expect(error).toBeInstanceOf(NotFoundError);
		expect(error.status).toBe(errorStatus);
		expect(error.cause.message).toContain(" could not be found");
	}
    expect(fetchMock.mock.calls[0][0]).toBe(resourceUri);
});
