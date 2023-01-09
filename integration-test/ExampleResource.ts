import { APIResource } from './../src/APIResource';

export interface ExampleResource extends APIResource {
    description: string;
    complexAttribute: {
        name: string;
    };
}
