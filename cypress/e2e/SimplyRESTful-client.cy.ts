import { NotFoundError, SimplyRESTfulClient } from "../../src";
import { ExampleResource } from "./ExampleResource";

describe('SimplyRESTful client', () => {
	const client = new SimplyRESTfulClient<ExampleResource>('/', 'application/x.testresource-v1+json');
	describe('list', () => {
		it('should retrieve all resources', async () => {
			const resources = await client.list();
			expect(resources.length).to.eq(3);
			expect(client.totalAmountOfLastRetrievedCollection).to.eq(3);
		})
	});

	describe('stream', () => {
		it('should retrieve all resources', async () => {
			const resources = await client.stream();
			expect(resources.length).to.eq(3);
			expect(client.totalAmountOfLastRetrievedCollection).to.eq(3);
		})
	});

	describe('create', () => {
		it('correctly creates the resource', async () => {
			const newResource: ExampleResource = { description: "This is a new resource", complexAttribute: { name: "complex attribute of the new resource" } };

			const newResourceUri: string = await client.create(newResource);

			const createdResource: ExampleResource = await client.read(newResourceUri);
			expect(createdResource.description).to.eq(createdResource.description);
			expect(createdResource.complexAttribute).to.eq(createdResource.complexAttribute);

			expect(await client.delete(newResourceUri)).to.be.true;
		});
	});

	describe('read', () => {
		it('retrieves the resource when the URL is provided', async () => {
			const listOfResources: ExampleResource[] = await client.list();
			expect(listOfResources.length).to.be.greaterThan(0);
			const resourceIdentifierFirstResource = listOfResources[0].self?.href;
			expect(resourceIdentifierFirstResource).to.exist;
			const retrieved: ExampleResource = await client.read(resourceIdentifierFirstResource);

			expect(retrieved.description).to.eq("This is test resource 0");
			expect(retrieved.complexAttribute.name).to.eq("complex attribute of test resource 0");
		});

		it('correctly retrieves the resource when only the UUID is provided', async () => {
			const listOfResources: ExampleResource[] = await client.list();
			expect(listOfResources.length).to.be.greaterThan(0);
			const resourceIdentifierFirstResource = listOfResources[0].self?.href;
			expect(resourceIdentifierFirstResource).to.exist;
			const resourceUuidFirstResource = new URL(resourceIdentifierFirstResource).pathname.split("/").pop();

			expect(resourceUuidFirstResource).to.exist;
			const retrieved: ExampleResource = await client.readWithUuid(resourceUuidFirstResource);

			expect(retrieved.description).to.eq("This is test resource 0");
			expect(retrieved.complexAttribute.name).to.eq("complex attribute of test resource 0");
		});
	});

	describe('update', () => {
		it('correctly updates the resource', async () => {
			const newResource: ExampleResource = { description: "This is a resource created for updating", complexAttribute: { name: "complex attribute of the new resource" } };
			const newResourceUri: string = await client.create(newResource);
			const createdResource: ExampleResource = await client.read(newResourceUri);
			expect(createdResource.description).to.eq("This is a resource created for updating")
			createdResource.description = "This is a resource that has been updated";

			await client.update(createdResource);

			const updatedResource: ExampleResource = await client.read(newResourceUri);
			expect(updatedResource.description).to.eq("This is a resource that has been updated");

			expect(await client.delete(newResourceUri)).to.be.true;
			cy
		});
	});

	describe('delete', () => {
		it('correctly deletes the resource', async () => {
			const toBeDeletedResource: ExampleResource = { description: "This is a resource created to be deleted", complexAttribute: { name: "complex attribute of the resource created to be deleted" } };
			const toBeDeletedResourceUri: string = await client.create(toBeDeletedResource);
			expect(await client.read(toBeDeletedResourceUri)).to.exist;

			expect(await client.delete(toBeDeletedResourceUri)).to.be.true;

			try{
				await client.read(toBeDeletedResourceUri);
			}
			catch(e) {
				expect(e).to.be.instanceOf(NotFoundError);
			}
		});
	});
})
