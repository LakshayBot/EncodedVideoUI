import { useState, useEffect } from 'react';
import { FileEncryption } from '@/components/FileEncryption';
import { TextEncryption } from '@/components/TextEncryption';
import { EncryptedFilesList } from '@/components/EncryptedFilesList';
import { FileText, FileVideo, List, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

export function EncryptionTools() {
    const [activeTab, setActiveTab] = useState<'file' | 'text' | 'list'>('file');
    const [isMobile, setIsMobile] = useState(false);

    // Handle responsive layout
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="container max-w-6xl px-4 py-8 mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    Encoded Video
                </h1>
                <p className="mt-2 text-muted-foreground max-w-2xl">
                    Secure your media with military-grade encryption. Protect your privacy with our powerful encryption tools.
                </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="pt-6">
                        <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 w-12 h-12 flex items-center justify-center mb-4">
                            <FileVideo className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">File Encryption</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Secure your videos and files with AES-256 encryption.
                        </p>
                        <button 
                            onClick={() => setActiveTab('file')}
                            className={cn(
                                "text-sm font-medium flex items-center",
                                activeTab === 'file' ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                            )}
                        >
                            Get Started <ArrowRight size={16} className="ml-1" />
                        </button>
                    </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="pt-6">
                        <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 w-12 h-12 flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Text Encryption</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Encrypt sensitive messages and information with ease.
                        </p>
                        <button 
                            onClick={() => setActiveTab('text')}
                            className={cn(
                                "text-sm font-medium flex items-center",
                                activeTab === 'text' ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"
                            )}
                        >
                            Get Started <ArrowRight size={16} className="ml-1" />
                        </button>
                    </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/20 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="pt-6">
                        <div className="rounded-full bg-green-100 dark:bg-green-900/30 w-12 h-12 flex items-center justify-center mb-4">
                            <List className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Encrypted Files</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Access and manage all your encrypted media in one place.
                        </p>
                        <button 
                            onClick={() => setActiveTab('list')}
                            className={cn(
                                "text-sm font-medium flex items-center",
                                activeTab === 'list' ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                            )}
                        >
                            View Files <ArrowRight size={16} className="ml-1" />
                        </button>
                    </CardContent>
                </Card>
            </div>

            {/* Tab Navigation - Sticky for better UX */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b mb-6 -mx-4 px-4">
                <div className="flex overflow-x-auto no-scrollbar">
                    <button
                        className={cn(
                            "py-3 px-5 font-medium text-sm flex items-center whitespace-nowrap transition-colors",
                            activeTab === 'file'
                                ? "border-b-2 border-primary text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setActiveTab('file')}
                    >
                        <FileVideo size={18} className="mr-2" />
                        File Encryption
                    </button>
                    <button
                        className={cn(
                            "py-3 px-5 font-medium text-sm flex items-center whitespace-nowrap transition-colors",
                            activeTab === 'text'
                                ? "border-b-2 border-primary text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setActiveTab('text')}
                    >
                        <FileText size={18} className="mr-2" />
                        Text Encryption
                    </button>
                    <button
                        className={cn(
                            "py-3 px-5 font-medium text-sm flex items-center whitespace-nowrap transition-colors",
                            activeTab === 'list'
                                ? "border-b-2 border-primary text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setActiveTab('list')}
                    >
                        <List size={18} className="mr-2" />
                        Encrypted Files
                    </button>
                </div>
            </div>

            {/* Tab content with smooth transitions */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'file' ? (
                        <FileEncryption onEncryptionComplete={() => setActiveTab('list')} />
                    ) : activeTab === 'text' ? (
                        <TextEncryption />
                    ) : (
                        <EncryptedFilesList />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}