import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { encryptText, decryptText } from '@/utils/encryptionApi';
import { Lock, Unlock, Key, Loader2, Copy, Check, AlertCircle, RefreshCw, HelpCircle, Info, ArrowRight, X } from 'lucide-react';
import { cn, generateRandomKey } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function TextEncryption() {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [key, setKey] = useState('');
    const [algorithm, setAlgorithm] = useState<'AES' | 'DES' | 'TRIPLE_DES'>('AES');
    const [isEncrypting, setIsEncrypting] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
    const [progressValue, setProgressValue] = useState(0);
    const outputRef = useRef<HTMLDivElement>(null);

    // Simulate progress during encryption/decryption operations
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isEncrypting || isDecrypting) {
            setProgressValue(0);
            interval = setInterval(() => {
                setProgressValue(prev => {
                    const increment = Math.random() * 15;
                    return Math.min(prev + increment, 95); // Cap at 95% until completion
                });
            }, 200);
        } else if (progressValue > 0) {
            setProgressValue(100); // Complete the progress
            setTimeout(() => setProgressValue(0), 1000);
        }

        return () => clearInterval(interval);
    }, [isEncrypting, isDecrypting]);

    // Scroll to output when content changes
    useEffect(() => {
        if (outputText && outputRef.current) {
            outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [outputText]);

    const handleEncrypt = async () => {
        if (!inputText) {
            setErrorMessage('Please enter text to encrypt');
            return;
        }

        if (!key) {
            setErrorMessage('Please enter an encryption key');
            return;
        }

        setIsEncrypting(true);
        setErrorMessage(null);

        try {
            // Updated to use the new function signature
            const encrypted = await encryptText(inputText, key, algorithm);
            setOutputText(encrypted);
        } catch (error) {
            console.error('Encryption error:', error);
            setErrorMessage(error instanceof Error ? error.message : 'An error occurred during encryption');
        } finally {
            setIsEncrypting(false);
        }
    };

    const handleDecrypt = async () => {
        if (!inputText) {
            setErrorMessage('Please enter text to decrypt');
            return;
        }

        if (!key) {
            setErrorMessage('Please enter a decryption key');
            return;
        }

        setIsDecrypting(true);
        setErrorMessage(null);

        try {
            // Updated to use the new function signature
            const decrypted = await decryptText(inputText, key, algorithm);
            setOutputText(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            setErrorMessage(error instanceof Error ? error.message : 'An error occurred during decryption');
        } finally {
            setIsDecrypting(false);
        }
    };

    const handleCopy = () => {
        if (outputText) {
            navigator.clipboard.writeText(outputText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleGenerateKey = () => {
        setKey(generateRandomKey());
    };

    const handleSwapContent = () => {
        if (outputText) {
            setInputText(outputText);
            setOutputText('');
            setMode(mode === 'encrypt' ? 'decrypt' : 'encrypt');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mode === 'encrypt' ? handleEncrypt() : handleDecrypt();
    };

    return (
        <Card className="shadow-soft-lg transition-all duration-300 border border-border/50 animate-fade-in">
            <CardHeader className="pb-3 space-y-1.5">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                            {mode === 'encrypt' ? <Lock size={18} /> : <Unlock size={18} />}
                        </div>
                        Text {mode === 'encrypt' ? 'Encryption' : 'Decryption'}
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-8 text-xs font-medium transition-colors",
                                mode === 'encrypt' ? "bg-primary/10 text-primary border-primary/20" : ""
                            )}
                            onClick={() => setMode('encrypt')}
                        >
                            <Lock size={14} className="mr-1" />
                            Encrypt
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-8 text-xs font-medium transition-colors",
                                mode === 'decrypt' ? "bg-primary/10 text-primary border-primary/20" : ""
                            )}
                            onClick={() => setMode('decrypt')}
                        >
                            <Unlock size={14} className="mr-1" />
                            Decrypt
                        </Button>
                    </div>
                </div>
                <CardDescription>
                    {mode === 'encrypt'
                        ? "Securely encrypt text using advanced cryptographic algorithms."
                        : "Decrypt previously encrypted text with the correct key."}
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                    {/* Input area */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="input-text" className="block text-sm font-medium">
                                {mode === 'encrypt' ? 'Text to Encrypt' : 'Encrypted Text'}
                            </label>
                            <div className="text-xs text-muted-foreground">
                                {inputText.length} characters
                            </div>
                        </div>
                        <div className="relative group">
                            <textarea
                                id="input-text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={mode === 'encrypt'
                                    ? "Enter the text you want to encrypt..."
                                    : "Paste the encrypted text here..."}
                                className="w-full h-32 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-primary/30 transition-all bg-card"
                                required
                            />
                            {inputText && (
                                <button
                                    type="button"
                                    className="absolute top-2 right-2 text-muted-foreground/70 hover:text-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setInputText('')}
                                    aria-label="Clear input"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Encryption key */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="encryption-key" className="block text-sm font-medium">
                                {mode === 'encrypt' ? 'Encryption Key' : 'Decryption Key'}
                            </label>
                            <div className="relative group">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={handleGenerateKey}
                                >
                                    <RefreshCw size={12} className="mr-1" />
                                    Generate Random Key
                                </Button>
                                <div className="absolute bottom-full mb-2 right-0 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-soft-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                    Generates a cryptographically strong random key that will be difficult to guess.
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <Key size={16} className="absolute top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <input
                                id="encryption-key"
                                type="text"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="Enter or generate encryption/decryption key"
                                className="w-full p-2.5 pl-9 border rounded-md focus:ring-2 ring-primary/30 transition-all"
                                required
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={handleGenerateKey}
                                    aria-label="Generate random key"
                                >
                                    <RefreshCw size={14} />
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <Info size={12} className="mt-0.5 flex-shrink-0" />
                            <span>
                                {mode === 'encrypt'
                                    ? "Keep this key safe. You'll need it to decrypt your text later."
                                    : "Enter the exact key that was used for encryption."}
                            </span>
                        </p>
                    </div>

                    {/* Algorithm selection */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium">
                                Encryption Algorithm
                            </label>
                            <div className="relative group">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <HelpCircle size={12} className="mr-1" />
                                    Algorithm Help
                                </Button>
                                <div className="absolute bottom-full mb-2 right-0 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-soft-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                    <p className="font-medium mb-1">Algorithm Comparison:</p>
                                    <ul className="space-y-1">
                                        <li><span className="font-medium">AES:</span> Most secure, modern standard</li>
                                        <li><span className="font-medium">DES:</span> Older, less secure standard</li>
                                        <li><span className="font-medium">Triple DES:</span> More secure than DES, but slower than AES</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                className={cn(
                                    "border rounded-md py-2.5 px-3 text-center text-sm transition-all",
                                    algorithm === 'AES'
                                        ? "bg-primary text-primary-foreground shadow-soft-sm"
                                        : "bg-card hover:bg-muted/50"
                                )}
                                onClick={() => setAlgorithm('AES')}
                            >
                                AES
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "border rounded-md py-2.5 px-3 text-center text-sm transition-all",
                                    algorithm === 'DES'
                                        ? "bg-primary text-primary-foreground shadow-soft-sm"
                                        : "bg-card hover:bg-muted/50"
                                )}
                                onClick={() => setAlgorithm('DES')}
                            >
                                DES
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "border rounded-md py-2.5 px-3 text-center text-sm transition-all",
                                    algorithm === 'TRIPLE_DES'
                                        ? "bg-primary text-primary-foreground shadow-soft-sm"
                                        : "bg-card hover:bg-muted/50"
                                )}
                                onClick={() => setAlgorithm('TRIPLE_DES')}
                            >
                                Triple DES
                            </button>
                        </div>
                    </div>

                    {/* Progress when processing */}
                    {progressValue > 0 && (
                        <div className="space-y-2 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    {progressValue < 100 ? 'Processing...' : 'Complete!'}
                                </span>
                                <span className="text-xs font-medium">{Math.round(progressValue)}%</span>
                            </div>
                            <Progress value={progressValue} className="h-1.5" />
                        </div>
                    )}

                    {/* Error messages */}
                    {errorMessage && (
                        <div className="flex gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md animate-fade-in">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">Error</p>
                                <p>{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Output area - only show when there's output */}
                    {outputText && (
                        <div className="space-y-2 mt-4 pt-4 border-t animate-fade-in" ref={outputRef}>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-medium">
                                    {mode === 'encrypt' ? 'Encrypted Result' : 'Decrypted Result'}
                                </label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSwapContent}
                                        className="h-7 text-xs"
                                    >
                                        Use as Input <ArrowRight size={12} className="ml-1" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="h-7 text-xs"
                                    >
                                        {copied ? (
                                            <Check size={12} className="mr-1 text-green-500" />
                                        ) : (
                                            <Copy size={12} className="mr-1" />
                                        )}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </Button>
                                </div>
                            </div>
                            <div className="w-full max-h-60 p-4 border rounded-md bg-muted/20 overflow-auto break-all text-sm shadow-inner">
                                {outputText}
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                        type="submit"
                        disabled={isEncrypting || isDecrypting || !inputText || !key}
                        className="w-full sm:flex-1 shadow-soft"
                    >
                        {isEncrypting || isDecrypting ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                {mode === 'encrypt' ? 'Encrypting...' : 'Decrypting...'}
                            </>
                        ) : (
                            <>
                                {mode === 'encrypt' ? (
                                    <>
                                        <Lock size={16} className="mr-2" />
                                        Encrypt Text
                                    </>
                                ) : (
                                    <>
                                        <Unlock size={16} className="mr-2" />
                                        Decrypt Text
                                    </>
                                )}
                            </>
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:flex-1 shadow-soft-sm"
                        disabled={isEncrypting || isDecrypting}
                        onClick={() => {
                            setInputText('');
                            setOutputText('');
                            setErrorMessage(null);
                        }}
                    >
                        Clear All
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}