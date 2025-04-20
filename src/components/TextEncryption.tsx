import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { encryptText, decryptText } from '@/utils/encryptionApi';
import { 
    Lock, Unlock, Key, Loader2, Copy, Check, AlertCircle, RefreshCw, 
    HelpCircle, Info, ArrowRight, X, MessageSquare, Send 
} from 'lucide-react';
import { cn, generateRandomKey } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    const [showAdvanced, setShowAdvanced] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);
    const [recentResults, setRecentResults] = useState<{input: string, output: string, mode: 'encrypt' | 'decrypt', timestamp: number}[]>([]);

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
            const encrypted = await encryptText(inputText, key, algorithm);
            setOutputText(encrypted);
            setRecentResults(prev => [{ input: inputText, output: encrypted, mode: 'encrypt', timestamp: Date.now() }, ...prev]);
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
            const decrypted = await decryptText(inputText, key, algorithm);
            setOutputText(decrypted);
            setRecentResults(prev => [{ input: inputText, output: decrypted, mode: 'decrypt', timestamp: Date.now() }, ...prev]);
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

    const isProcessing = isEncrypting || isDecrypting;

    return (
        <Card className="shadow-lg border-border/50 overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/10">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <div className="p-2 rounded-md bg-purple-600 text-white shadow-sm">
                            {mode === 'encrypt' ? <Lock size={20} /> : <Unlock size={20} />}
                        </div>
                        Text {mode === 'encrypt' ? 'Encryption' : 'Decryption'}
                    </CardTitle>
                    
                    <RadioGroup 
                        value={mode} 
                        onValueChange={(value) => setMode(value as 'encrypt' | 'decrypt')}
                        className="flex gap-1 p-1 bg-muted rounded-lg"
                    >
                        <div className="flex items-center space-x-1">
                            <RadioGroupItem value="encrypt" id="text-encrypt" className="sr-only" />
                            <Label 
                                htmlFor="text-encrypt" 
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors flex items-center gap-1.5",
                                    mode === 'encrypt' ? "bg-card shadow-sm" : "hover:bg-background/50"
                                )}
                            >
                                <Lock size={14} />
                                Encrypt
                            </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                            <RadioGroupItem value="decrypt" id="text-decrypt" className="sr-only" />
                            <Label 
                                htmlFor="text-decrypt" 
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors flex items-center gap-1.5",
                                    mode === 'decrypt' ? "bg-card shadow-sm" : "hover:bg-background/50"
                                )}
                            >
                                <Unlock size={14} />
                                Decrypt
                            </Label>
                        </div>
                    </RadioGroup>
                </div>
                <CardDescription>
                    {mode === 'encrypt'
                        ? "Securely encrypt sensitive text messages with strong cryptographic protection."
                        : "Decrypt previously encrypted messages with the correct key."}
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit} className="contents">
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="input-text" className="flex items-center gap-1.5 text-sm font-medium">
                                <MessageSquare size={16} className="text-purple-600" />
                                {mode === 'encrypt' ? 'Text to Encrypt' : 'Encrypted Text'}
                            </label>
                            <div className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                                {inputText.length} characters
                            </div>
                        </div>
                        <div className="relative">
                            <textarea
                                id="input-text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={mode === 'encrypt'
                                    ? "Enter the text you want to encrypt..."
                                    : "Paste the encrypted text here..."}
                                className="w-full h-36 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-purple-400/30 transition-all bg-card"
                                required
                                disabled={isProcessing}
                            />
                            {inputText && !isProcessing && (
                                <Button
                                    type="button"
                                    className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-foreground bg-background/50 hover:bg-background"
                                    onClick={() => setInputText('')}
                                    aria-label="Clear input"
                                >
                                    <X size={14} />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="encryption-key" className="flex items-center gap-1.5 text-sm font-medium">
                                <Key size={16} className="text-purple-600" />
                                {mode === 'encrypt' ? 'Encryption Key' : 'Decryption Key'}
                            </label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={handleGenerateKey}
                                            disabled={isProcessing}
                                        >
                                            <RefreshCw size={12} className="mr-1" />
                                            Generate Secure Key
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <p className="text-xs">
                                            Creates a cryptographically strong key.<br />
                                            Save this key to decrypt your message later.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="relative">
                            <div className="absolute top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                                <Lock size={16} />
                            </div>
                            <input
                                id="encryption-key"
                                type="text"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder={mode === 'encrypt' 
                                    ? "Enter or generate a secure key"
                                    : "Enter the key used for encryption"}
                                className="w-full p-3 pl-10 border rounded-lg focus:ring-2 ring-purple-400/30 transition-all"
                                required
                                disabled={isProcessing}
                            />
                            {key && !isProcessing && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                                    onClick={() => setKey('')}
                                >
                                    <X size={14} />
                                </Button>
                            )}
                        </div>
                        <div className={cn(
                            "flex items-start gap-1.5 text-xs",
                            key.length > 0 && key.length < 8 ? "text-amber-500" : "text-muted-foreground"
                        )}>
                            <Info size={12} className="mt-0.5 flex-shrink-0" />
                            <span>
                                {mode === 'encrypt' 
                                    ? key.length > 0 && key.length < 8 
                                        ? "Warning: Short keys are vulnerable. Use at least 8 characters for security." 
                                        : "Store this key securely. Without it, your message cannot be recovered."
                                    : "You must provide the exact encryption key used originally."}
                            </span>
                        </div>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-500 transition-colors"
                            disabled={isProcessing}
                        >
                            <ArrowRight 
                                size={16} 
                                className={cn(
                                    "transition-transform",
                                    showAdvanced && "transform rotate-90"
                                )} 
                            />
                            Advanced Options
                        </button>
                        
                        <AnimatePresence>
                            {showAdvanced && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-3 space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-medium flex items-center gap-1.5">
                                                    <HelpCircle size={16} className="text-purple-600" />
                                                    Encryption Algorithm
                                                </label>
                                            </div>
                                            <RadioGroup 
                                                value={algorithm} 
                                                onValueChange={(value) => setAlgorithm(value as 'AES' | 'DES' | 'TRIPLE_DES')}
                                                className="flex flex-wrap gap-2"
                                                disabled={isProcessing}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <RadioGroupItem value="AES" id="text-aes" className="sr-only" />
                                                    <Label 
                                                        htmlFor="text-aes" 
                                                        className={cn(
                                                            "px-4 py-2.5 border rounded-md text-sm font-medium cursor-pointer transition-all",
                                                            algorithm === 'AES' 
                                                                ? "bg-purple-600 text-white border-purple-600" 
                                                                : "bg-card hover:bg-muted/50"
                                                        )}
                                                    >
                                                        AES-256 <span className="text-xs ml-1 opacity-80">(Recommended)</span>
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <RadioGroupItem value="DES" id="text-des" className="sr-only" />
                                                    <Label 
                                                        htmlFor="text-des" 
                                                        className={cn(
                                                            "px-4 py-2.5 border rounded-md text-sm font-medium cursor-pointer transition-all",
                                                            algorithm === 'DES' 
                                                                ? "bg-purple-600 text-white border-purple-600" 
                                                                : "bg-card hover:bg-muted/50"
                                                        )}
                                                    >
                                                        DES
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <RadioGroupItem value="TRIPLE_DES" id="text-triple_des" className="sr-only" />
                                                    <Label 
                                                        htmlFor="text-triple_des" 
                                                        className={cn(
                                                            "px-4 py-2.5 border rounded-md text-sm font-medium cursor-pointer transition-all",
                                                            algorithm === 'TRIPLE_DES' 
                                                                ? "bg-purple-600 text-white border-purple-600" 
                                                                : "bg-card hover:bg-muted/50"
                                                        )}
                                                    >
                                                        Triple DES
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {progressValue > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-2"
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Loader2 
                                            className={cn(
                                                "h-4 w-4", 
                                                progressValue < 100 ? "animate-spin" : ""
                                            )} 
                                        />
                                        <span className="text-muted-foreground">
                                            {progressValue < 100 ? 'Processing...' : 'Complete!'}
                                        </span>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                        {Math.round(progressValue)}%
                                    </span>
                                </div>
                                <Progress 
                                    value={progressValue} 
                                    className="h-2 rounded-full bg-purple-100/50 dark:bg-purple-900/20"
                                    indicatorClassName="bg-purple-600"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {errorMessage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <Alert className="border-destructive/50 bg-destructive/10">
                                    <AlertCircle className="h-5 w-5 text-destructive" />
                                    <AlertTitle className="text-destructive font-medium">Error</AlertTitle>
                                    <AlertDescription className="text-destructive/90">
                                        {errorMessage}
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {outputText && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-3 pt-2" 
                                ref={outputRef}
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="flex items-center gap-1.5 text-sm font-medium">
                                        <Check size={16} className="text-green-600" />
                                        {mode === 'encrypt' ? 'Encrypted Result' : 'Decrypted Result'}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSwapContent}
                                            className="h-7 text-xs"
                                            disabled={isProcessing}
                                        >
                                            Use as Input <ArrowRight size={12} className="ml-1" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopy}
                                            className={cn(
                                                "h-7 text-xs",
                                                copied && "bg-green-50 text-green-700 border-green-200"
                                            )}
                                            disabled={isProcessing}
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
                                <div className="relative">
                                    <div className="w-full max-h-60 p-4 border rounded-lg bg-muted/20 overflow-auto break-all text-sm shadow-inner">
                                        {outputText}
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-30">
                                        {mode === 'encrypt' ? <Lock size={16} /> : <Unlock size={16} />}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {recentResults.length > 0 && (
                        <div className="pt-2 border-t">
                            <Tabs defaultValue="recent">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium">Recent Operations</h3>
                                    <TabsList className="h-7 p-1">
                                        <TabsTrigger value="recent" className="text-xs px-2 py-1">Recent</TabsTrigger>
                                        <TabsTrigger value="history" className="text-xs px-2 py-1">History</TabsTrigger>
                                    </TabsList>
                                </div>
                                
                                <TabsContent value="recent" className="mt-0">
                                    <div className="border rounded-lg divide-y max-h-40 overflow-auto">
                                        {recentResults.slice(0, 3).map((item, idx) => (
                                            <div 
                                                key={idx} 
                                                className="p-2 text-xs flex cursor-pointer hover:bg-muted/50"
                                                onClick={() => {
                                                    setInputText(item.input);
                                                    setMode(item.mode === 'encrypt' ? 'decrypt' : 'encrypt');
                                                }}
                                            >
                                                <div className="flex-grow truncate pr-2">
                                                    <div className="font-medium flex items-center gap-1">
                                                        {item.mode === 'encrypt' ? (
                                                            <><Lock size={12} /> Encrypted</>
                                                        ) : (
                                                            <><Unlock size={12} /> Decrypted</>
                                                        )}
                                                    </div>
                                                    <div className="truncate text-muted-foreground mt-1">
                                                        {item.input.substring(0, 30)}
                                                        {item.input.length > 30 ? '...' : ''}
                                                    </div>
                                                </div>
                                                <div className="text-right text-muted-foreground whitespace-nowrap">
                                                    {getTimeSince(item.timestamp)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="history" className="mt-0">
                                    <div className="text-xs text-muted-foreground">
                                        View your full encryption history
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 border-t py-4 bg-muted/10">
                    <Button
                        type="submit"
                        disabled={isProcessing || !inputText || !key}
                        className="w-full sm:flex-1 shadow-md bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                    >
                        {isProcessing ? (
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
                        className="w-full sm:w-auto"
                        disabled={isProcessing || (!inputText && !outputText && !key)}
                        onClick={() => {
                            setInputText('');
                            setOutputText('');
                            setErrorMessage(null);
                        }}
                    >
                        <X size={14} className="mr-2" />
                        Clear
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

function getTimeSince(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}