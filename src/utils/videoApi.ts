import api from './api';
import { VideoSegment } from '@/utils/segmentVideo';

// Video processing endpoints
export const videoAPI = {
    // Upload a video for processing
    uploadVideo: (file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('file', file);

        return api.post('/Video/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });
    },

    // Process a video (transcode, segment, etc.)
    processVideo: (videoId: string, options: any) => {
        return api.post(`/Video/${videoId}/process`, options);
    },

    // Get all uploaded videos
    getVideos: () => {
        return api.get('/Video');
    },

    // Get a specific video details
    getVideo: (videoId: string) => {
        return api.get(`/Video/${videoId}`);
    },

    // Save segmented videos
    saveSegments: (videoId: string, segments: VideoSegment[]) => {
        return api.post(`/Video/${videoId}/segments`, { segments });
    },
};

export default videoAPI;
