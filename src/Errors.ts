/**
 * Errors matching common HTTP status codes.
 * (Modeled after JAX-RS exceptions)
 *
 * The correct type of Error can be created based on the status code or response,
 * using the fromStatus() or fromResponse() method respectively. A specific error
 * will be created for any HTTP status codes defined in RFC7231 and RFC6585. For
 * other status codes in the 3xx, 4xx and 5xx range, a generic WebApplicationError
 * is created with the provided status code and message.
 */
import { HTTP_HEADER_NAME_LOCATION } from './simplyrestful-client';

export function fromResponse(response: Response, cause?: Error) : WebApplicationError {
	const status = response.status;

	if (status < 300 || status >= 600){
		throw new Error('Status codes that are not in the ranges 3xx, 4xx or 5xx do not imply an error');
	}
	if (status < 400){
		const location = response?.headers.get(HTTP_HEADER_NAME_LOCATION);
		if (!location){
			throw new Error('When status code is in range 3xx, a location URI must be included in the Location HTTP header of the response');
		}
		else {
			switch(status){
				case 300: return new RedirectionError(300, location, 'Multiple Choices', cause, response);
				case 301: return new RedirectionError(301, location, 'Moved Permanently', cause, response);
				case 302: return new RedirectionError(302, location, 'Found', cause, response);
				case 303: return new RedirectionError(303, location, 'See Other', cause, response);
				case 304: return new RedirectionError(304, location, 'Not Modified', cause, response);
				case 305: return new RedirectionError(305, location, 'Use Proxy', cause, response);
				case 307: return new RedirectionError(307, location, 'Temporary Redirect', cause, response);
			}
		}
	}
	switch(status){
		case 400: return new BadRequestError(cause, response);
		case 401: return new NotAuthorizedError(cause, response);
		case 402: return new ClientError(402, 'Payment Required', cause, response);
		case 403: return new ForbiddenError(cause, response);
		case 404: return new NotFoundError(cause, response);
		case 405: return new NotAllowedError(cause, response);
		case 406: return new NotAcceptableError(cause, response);
		case 407: return new ClientError(407, 'Proxy Authentication Required', cause, response);
		case 408: return new ClientError(408, 'Request Timeout', cause, response);
		case 409: return new ClientError(409, 'Conflict', cause, response);
		case 410: return new ClientError(410, 'Gone', cause, response);
		case 411: return new ClientError(411, 'Length Required', cause, response);
		case 412: return new ClientError(412, 'Precondition Failed', cause, response);
		case 413: return new ClientError(413, 'Payload Too Large', cause, response);
		case 414: return new ClientError(414, 'URI Too Long', cause, response);
		case 415: return new NotSupportedError(cause, response);
		case 416: return new ClientError(416, 'Range Not Satisfiable', cause, response);
		case 417: return new ClientError(417, 'Expectation Failed', cause, response);
		case 426: return new ClientError(426, 'Upgrade Required', cause, response);
		case 428: return new ClientError(428, 'Precondition Required', cause, response);
		case 429: return new ClientError(429, 'Too Many Requests', cause, response);
		case 431: return new ClientError(431, 'Request Header Fields Too Large', cause, response);
		case 500: return new InternalServerError(cause, response);
		case 501: return new NotImplementedError(cause, response);
		case 502: return new BadGatewayError(cause, response);
		case 503: return new ServiceUnavailableError(cause, response);
		case 504: return new GatewayTimeoutError(cause, response);
		case 505: return new ServerError(505, 'HTTP Version Not Supported', cause, response);
		case 511: return new ServerError(511, 'Network Authentication Required', cause, response);
		default: return new WebApplicationError(status, response?.statusText, cause, response);
	}
}

export class WebApplicationError extends Error {
	public constructor(
		public status: number,
		message?: string,
		public cause?: Error,
		public response?: Response
	) {
		super(message, { cause });
		if (status < 300 || status >= 600){
			throw new Error('Status code for error must be in the 3xx, 4xx or 5xx range');
		}
	}
}

export class RedirectionError extends WebApplicationError {
	public constructor(
		status: number,
		public location: string,
		message?: string,
		cause?: Error,
		response?: Response
	) {
		super(status, message, cause, response);
		if (status < 300 || status >= 400){
			throw new Error('Status code for redirect error must be in the 3xx range');
		}
	}
}

export class ClientError extends WebApplicationError {
	public constructor(
		status: number,
		message?: string,
		cause?: Error,
		response?: Response
	) {
		super(status, message, cause, response);
		if (status < 400 || status >= 500){
			throw new Error('Status code for client error must be in the 4xx range');
		}
	}
}

export class BadRequestError extends ClientError {
	public constructor(
		cause?: Error,
		response?: Response
	) {
		super(400, 'Bad Request', cause, response);
	}
}

export class NotAuthorizedError extends ClientError {
	public constructor(
		cause?: Error,
		response?: Response
	) {
		super(401, 'Unauthorized', cause, response);
	}
}

export class ForbiddenError extends ClientError {
	public constructor(
		cause?: Error,
		response?: Response
	) {
		super(403, 'Forbidden', cause, response);
	}
}

export class NotFoundError extends ClientError {
	public constructor(
		cause?: Error,
		response?: Response
	) {
		super(404, 'Not Found', cause, response);
	}
}

export class NotAllowedError extends ClientError {
	public constructor(
		cause?: Error,
		response?: Response
	) {
		super(405, 'Method Not Allowed', cause, response);
	}
}

export class NotAcceptableError extends ClientError {
	public constructor(
		cause?: Error,
		response?: Response
	) {
		super(406, 'Not Acceptable', cause, response);
	}
}

export class NotSupportedError extends ClientError {
	public constructor(
		cause?: Error,
		response?: Response
	) {
		super(415, 'Unsupported Media Type', cause, response);
	}
}

export class ServerError extends WebApplicationError {
	public constructor(
		status: number,
		message?: string,
		cause?: Error,
		response?: Response
	) {
		super(status, message, cause, response);
		if (status < 500 || status >= 600){
			throw new Error('Status code for server error must be in the 5xx range');
		}
	}
}

export class InternalServerError extends ServerError {
	public constructor(
		cause?: Error,
		response?: Response
	) {
		super(500, 'Internal Server Error', cause, response);
	}
}

export class NotImplementedError extends ServerError {
	public constructor(
		cause?: Error,
		response?: Response
	) {
		super(501, 'Not Implemented', cause, response);
	}
}

export class BadGatewayError extends ServerError {
	public constructor(
		cause?: Error,
		response?: Response
	) {
		super(502, 'Bad Gateway', cause, response);
	}
}

export class ServiceUnavailableError extends ServerError {
	public constructor(
		cause?: Error,
		response?: Response
	) {
		super(503, 'Service Unavailable', cause, response);
	}
}

export class GatewayTimeoutError extends ServerError {
	public constructor(
		cause?: Error,
		response?: Response
	) {
		super(504, 'Gateway Timeout', cause, response);
	}
}
