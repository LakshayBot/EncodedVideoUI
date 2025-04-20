import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileEncryption } from '@/components/FileEncryption';
import { TextEncryption } from '@/components/TextEncryption';
import { EncryptedFilesList } from '@/components/EncryptedFilesList';
import { FileText, FileVideo, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EncryptionTools() {
    const [activeTab, setActiveTab] = useState<'text' | 'file' | 'list'>('file');

    return (
        <div className="mx-auto max-w-3xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Encryption Tools</h1>
                <div className="text-sm text-muted-foreground">
                    Secure your data with advanced encryption
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6 overflow-x-auto no-scrollbar">
                <button
                    className={cn(
                        "py-2 px-4 font-medium text-sm border-b-2 -mb-px flex items-center whitespace-nowrap transition-colors duration-200",
                        activeTab === 'file'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                    )}
                    onClick={() => setActiveTab('file')}
                >
                    <FileVideo size={16} className="mr-2" />
                    File Encryption
                </button>
                <button
                    className={cn(
                        "py-2 px-4 font-medium text-sm border-b-2 -mb-px flex items-center whitespace-nowrap transition-colors duration-200",
                        activeTab === 'text'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                    )}
                    onClick={() => setActiveTab('text')}
                >
                    <FileText size={16} className="mr-2" />
                    Text Encryption
                </button>
                <button
                    className={cn(
                        "py-2 px-4 font-medium text-sm border-b-2 -mb-px flex items-center whitespace-nowrap transition-colors duration-200",
                        activeTab === 'list'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                    )}
                    onClick={() => setActiveTab('list')}
                >
                    <List size={16} className="mr-2" />
                    Encrypted Files
                </button>
            </div>

            {/* Tab content */}
            <div>
                {activeTab === 'file' ? (
                    <div className="animate-slide-in">
                        <FileEncryption onEncryptionComplete={() => setActiveTab('list')} />
                    </div>
                ) : activeTab === 'text' ? (
                    <div className="animate-slide-in">
                        <TextEncryption />
                    </div>
                ) : (
                    <div className="animate-slide-in">
                        <EncryptedFilesList />
                    </div>
                )}
            </div>
        </div>
    );
}