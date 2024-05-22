import { APIResource } from "../src/types/APIResource";

export interface ExampleResource extends APIResource {
    description: string;
    complexAttribute: {
        name: string;
    };
}
