import { APIResource } from '../src/APIResource';
import { Link } from './../src/Link';

export type TestResource = APIResource & {
	someLink?: Link;
	additionalField?: string;
	someNumber?: number;
	someDate?: Date;
}
