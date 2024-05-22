import { APIResource } from './APIResource';
import { Link } from './Link';

export interface APICollection<T extends APIResource> extends APIResource {
    total: number;
	first: Link,
	last: Link,
	prev: Link,
	next: Link;
    item: T[];
}
