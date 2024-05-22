import { APIResource } from "../src/types/APIResource";
import { Link } from "../src/types/Link";


export type TestResource = APIResource & {
	someLink?: Link;
	additionalField?: string;
	someNumber?: number;
	someDate?: Date;
}
