/**
 * API client for encryption/decryption operations
 */

const API_BASE_URL = 'https://localhost:7173/api/encryption';

// Enhanced interfaces with additional properties
export interface EncryptionParams {
    file: File;
    key: string;
    algorithm: 'AES' | 'DES' | 'TRIPLE_DES';
    onProgress?: (progress: number) => void;
    abortSignal?: AbortSignal;
}

export interface TextEncryptionParams {
    text: string;
    key: string;
    algorithm: 'AES' | 'DES' | 'TRIPLE_DES';
    abortSignal?: AbortSignal;
}

export interface EncryptedFileInfo {
    fileId: string;
    fileName: string;
    fileSize: number;
    algorithm: string;
    downloadUrl: string;
}

export interface EncryptedFileListItem {
    id: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    algorithm: string;
    createdAt: string;
    downloadUrl: string;
}

// Detailed error types for better error handling
export class EncryptionApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'EncryptionApiError';
        this.status = status;
    }
}

export class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class TimeoutError extends Error {
    constructor(message: string = 'Request timed out') {
        super(message);
        this.name = 'TimeoutError';
    }
}

// Helper function to handle API responses consistently
async function handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorText = await response.text();
        throw new EncryptionApiError(
            `API error: ${errorText}`,
            response.status
        );
    }

    try {
        return await response.json() as T;
    } catch (error) {
        throw new Error('Failed to parse API response');
    }
}

/**
 * Creates an AbortController with a timeout
 */
function createTimeoutController(timeoutMs: number = 30000): { controller: AbortController; clear: () => void } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    return {
        controller,
        clear: () => clearTimeout(timeoutId)
    };
}

/**
 * Upload with progress tracking
 */
async function uploadWithProgress(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void,
    abortSignal?: AbortSignal
): Promise<Response> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('POST', url);
        
        // Add authentication token to request header
        const token = localStorage.getItem('token');
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        if (onProgress) {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    onProgress(progress);
                }
            });
        }

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = new Response(xhr.response, {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: new Headers({
                        'Content-Type': xhr.getResponseHeader('Content-Type') || 'application/json'
                    })
                });
                resolve(response);
            } else {
                reject(new EncryptionApiError(`Request failed with status ${xhr.status}`, xhr.status));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new NetworkError('Network error occurred'));
        });

        xhr.addEventListener('timeout', () => {
            reject(new TimeoutError());
        });

        if (abortSignal) {
            abortSignal.addEventListener('abort', () => {
                xhr.abort();
                reject(new Error('Request was aborted'));
            });
        }

        xhr.responseType = 'blob';
        xhr.timeout = 300000; // 5 minutes timeout
        xhr.send(formData);
    });
}

/**
 * Encrypts a file and returns info about the encrypted file
 */
export async function encryptFile({
    file,
    key,
    algorithm,
    onProgress,
    abortSignal
}: EncryptionParams): Promise<EncryptedFileInfo> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);
    formData.append('algorithm', algorithm);

    try {
        // Use upload with progress if onProgress is provided
        const response = onProgress
            ? await uploadWithProgress(
                `${API_BASE_URL}/encrypt`,
                formData,
                onProgress,
                abortSignal
            )
            : await fetch(`${API_BASE_URL}/encrypt`, {
                method: 'POST',
                body: formData,
                signal: abortSignal
            });

        return await handleApiResponse<EncryptedFileInfo>(response);
    } catch (error) {
        // Re-throw network errors with appropriate type
        if (error instanceof TypeError && error.message.includes('network')) {
            throw new NetworkError('Failed to connect to encryption service');
        }

        // Handle abort errors
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('Encryption request was cancelled');
        }

        throw error;
    }
}

/**
 * Decrypts a file and returns the decrypted file as a blob
 */
export async function decryptFile({
    file,
    key,
    algorithm,
    onProgress,
    abortSignal
}: EncryptionParams): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);
    formData.append('algorithm', algorithm);

    try {
        // Use upload with progress if onProgress is provided
        const response = onProgress
            ? await uploadWithProgress(
                `${API_BASE_URL}/decrypt`,
                formData,
                onProgress,
                abortSignal
            )
            : await fetch(`${API_BASE_URL}/decrypt`, {
                method: 'POST',
                body: formData,
                signal: abortSignal
            });

        if (!response.ok) {
            const errorText = await response.text();
            throw new EncryptionApiError(`Failed to decrypt file: ${errorText}`, response.status);
        }

        return await response.blob();
    } catch (error) {
        // Re-throw network errors with appropriate type
        if (error instanceof TypeError && error.message.includes('network')) {
            throw new NetworkError('Failed to connect to decryption service');
        }

        // Handle abort errors
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('Decryption request was cancelled');
        }

        throw error;
    }
}

/**
 * Decrypts a file by its ID
 */
export async function decryptFileById(
    fileId: string,
    key: string,
    options?: {
        onProgress?: (progress: number) => void,
        abortSignal?: AbortSignal,
        timeoutMs?: number
    }
): Promise<Blob> {
    const formData = new FormData();
    formData.append('key', key);

    // Create a timeout controller if no abort signal provided
    const timeoutController = !options?.abortSignal ?
        createTimeoutController(options?.timeoutMs) : null;

    // Use the provided signal or the timeout controller
    const signal = options?.abortSignal || timeoutController?.controller.signal;

    try {
        // Use upload with progress if onProgress is provided
        const response = options?.onProgress
            ? await uploadWithProgress(
                `${API_BASE_URL}/decrypt/${fileId}`,
                formData,
                options.onProgress,
                signal
            )
            : await fetch(`${API_BASE_URL}/decrypt/${fileId}`, {
                method: 'POST',
                body: formData,
                signal
            });

        if (!response.ok) {
            const errorText = await response.text();
            throw new EncryptionApiError(`Failed to decrypt file: ${errorText}`, response.status);
        }

        return await response.blob();
    } catch (error) {
        // Re-throw network errors with appropriate type
        if (error instanceof TypeError && error.message.includes('network')) {
            throw new NetworkError('Failed to connect to decryption service');
        }

        // Handle abort errors
        if (error instanceof DOMException && error.name === 'AbortError') {
            if (timeoutController) {
                throw new TimeoutError();
            } else {
                throw new Error('Decryption request was cancelled');
            }
        }

        throw error;
    } finally {
        // Clean up timeout if we created it
        if (timeoutController) {
            timeoutController.clear();
        }
    }
}

/**
 * Retrieves a list of all encrypted files
 */
export async function getEncryptedFiles(
    options?: {
        abortSignal?: AbortSignal,
        timeoutMs?: number,
        cache?: RequestCache
    }
): Promise<EncryptedFileListItem[]> {
    // Create a timeout controller if no abort signal provided
    const timeoutController = !options?.abortSignal ?
        createTimeoutController(options?.timeoutMs) : null;

    // Use the provided signal or the timeout controller
    const signal = options?.abortSignal || timeoutController?.controller.signal;
    
    // Get auth token
    const token = localStorage.getItem('token');
    const headers = new Headers();
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/files`, {
            signal,
            cache: options?.cache || 'default',
            headers
        });

        return await handleApiResponse<EncryptedFileListItem[]>(response);
    } catch (error) {
        // Re-throw network errors with appropriate type
        if (error instanceof TypeError && error.message.includes('network')) {
            throw new NetworkError('Failed to connect to encryption service');
        }

        // Handle abort errors
        if (error instanceof DOMException && error.name === 'AbortError') {
            if (timeoutController) {
                throw new TimeoutError();
            } else {
                throw new Error('Request was cancelled');
            }
        }

        throw error;
    } finally {
        // Clean up timeout if we created it
        if (timeoutController) {
            timeoutController.clear();
        }
    }
}

/**
 * Downloads an encrypted file by ID
 */
export async function downloadEncryptedFile(
    fileId: string,
    options?: {
        onProgress?: (progress: number) => void,
        abortSignal?: AbortSignal,
        timeoutMs?: number
    }
): Promise<Blob> {
    // Create a timeout controller if no abort signal provided
    const timeoutController = !options?.abortSignal ?
        createTimeoutController(options?.timeoutMs) : null;

    // Use the provided signal or the timeout controller
    const signal = options?.abortSignal || timeoutController?.controller.signal;

    // Get auth token
    const token = localStorage.getItem('token');
    const headers = new Headers();
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    try {
        // Use fetch for downloads, but display progress if available
        const response = await fetch(`${API_BASE_URL}/download/${fileId}`, {
            signal,
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new EncryptionApiError(`Failed to download file: ${errorText}`, response.status);
        }

        // If we have a progress callback and the content-length header is available
        if (options?.onProgress && response.headers.has('content-length')) {
            const contentLength = Number(response.headers.get('content-length'));
            const reader = response.body?.getReader();

            if (reader && contentLength) {
                let receivedLength = 0;
                const chunks: Uint8Array[] = [];

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    chunks.push(value);
                    receivedLength += value.length;

                    // Report progress
                    options.onProgress(Math.min(100, Math.round((receivedLength / contentLength) * 100)));
                }

                // Concatenate chunks into a single Uint8Array
                const allChunks = new Uint8Array(receivedLength);
                let position = 0;

                for (const chunk of chunks) {
                    allChunks.set(chunk, position);
                    position += chunk.length;
                }

                return new Blob([allChunks]);
            }
        }

        // Fallback to regular blob download if we don't have progress or content-length
        return await response.blob();
    } catch (error) {
        // Re-throw network errors with appropriate type
        if (error instanceof TypeError && error.message.includes('network')) {
            throw new NetworkError('Failed to connect to encryption service');
        }

        // Handle abort errors
        if (error instanceof DOMException && error.name === 'AbortError') {
            if (timeoutController) {
                throw new TimeoutError();
            } else {
                throw new Error('Download was cancelled');
            }
        }

        throw error;
    } finally {
        // Clean up timeout if we created it
        if (timeoutController) {
            timeoutController.clear();
        }
    }
}

/**
 * Encrypts text and returns the encrypted result
 */
export async function encryptText(text: string, key: string, algorithm: string = 'AES'): Promise<string> {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Authentication required');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/encrypt-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                inputMode: text,  // Changed to match backend model property
                key: key,
                algorithm: algorithm
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error:', response.status, errorText);
            throw new EncryptionApiError(`Failed to encrypt text: ${errorText}`, response.status);
        }

        const result = await response.json();
        return result.encryptedText;
    } catch (error) {
        if (error instanceof EncryptionApiError) {
            throw error;
        }
        throw new EncryptionApiError(
            `Failed to encrypt text: ${error instanceof Error ? error.message : 'Unknown error'}`,
            0
        );
    }
}

/**
 * Decrypts text and returns the decrypted result
 */
export async function decryptText(text: string, key: string, algorithm: string = 'AES'): Promise<string> {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Authentication required');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/decrypt-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                inputMode: text,  // Changed to match backend model property
                key: key,
                algorithm: algorithm
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error:', response.status, errorText);
            throw new EncryptionApiError(`Failed to decrypt text: ${errorText}`, response.status);
        }

        const result = await response.json();
        return result.decryptedText;
    } catch (error) {
        if (error instanceof EncryptionApiError) {
            throw error;
        }
        throw new EncryptionApiError(
            `Failed to decrypt text: ${error instanceof Error ? error.message : 'Unknown error'}`,
            0
        );
    }
}