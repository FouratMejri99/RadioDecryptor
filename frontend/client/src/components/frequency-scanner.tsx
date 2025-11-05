import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Radio, Search, Lock, Unlock, Signal, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Frequency } from "@shared/schema";

interface FrequencyScannerProps {
  currentFrequency: number;
  onFrequencySelect: (frequency: Frequency) => void;
  onStartScan: () => void;
  isScanning: boolean;
}

interface ScannedFrequency extends Frequency {
  signalStrength: number;
  isActive: boolean;
  lastDetected: number;
}

export function FrequencyScanner({
  currentFrequency,
  onFrequencySelect,
  onStartScan,
  isScanning
}: FrequencyScannerProps) {
  const [scannedFrequencies, setScannedFrequencies] = useState<ScannedFrequency[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'signal' | 'frequency' | 'name'>('signal');

  // Fetch available frequencies
  const { data: frequencies = [] } = useQuery<Frequency[]>({
    queryKey: ['/api/frequencies'],
  });

  // Simulate frequency scanning
  useEffect(() => {
    if (!isScanning) return;

    const scanInterval = setInterval(() => {
      setScanProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        
        if (newProgress >= 100) {
          clearInterval(scanInterval);
          return 100;
        }
        
        // Randomly discover frequencies during scan
        if (Math.random() < 0.3 && frequencies.length > 0) {
          const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
          const signalStrength = -80 + Math.random() * 40; // -80 to -40 dBm
          
          setScannedFrequencies(prev => {
            const existing = prev.find(f => f.id === randomFreq.id);
            if (existing) {
              // Update existing frequency
              return prev.map(f => 
                f.id === randomFreq.id 
                  ? { ...f, signalStrength, lastDetected: Date.now() }
                  : f
              );
            } else {
              // Add new frequency
              return [...prev, {
                ...randomFreq,
                signalStrength,
                isActive: signalStrength > -70,
                lastDetected: Date.now()
              }];
            }
          });
        }
        
        return newProgress;
      });
    }, 200);

    return () => clearInterval(scanInterval);
  }, [isScanning, frequencies]);

  // Filter and sort frequencies
  const filteredFrequencies = scannedFrequencies
    .filter(freq => selectedCategory === 'all' || freq.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'signal':
          return b.signalStrength - a.signalStrength;
        case 'frequency':
          return a.frequency - b.frequency;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const getSignalIcon = (strength: number) => {
    if (strength > -50) return <Signal className="w-4 h-4 text-green-500" />;
    if (strength > -70) return <Signal className="w-4 h-4 text-yellow-500" />;
    return <Signal className="w-4 h-4 text-red-500" />;
  };

  const getEncryptionIcon = (isEncrypted: boolean) => {
    return isEncrypted ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-green-500" />;
  };

  const getSignalStrengthColor = (strength: number) => {
    if (strength > -50) return 'text-green-600';
    if (strength > -70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="px-4 pb-4">
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-medium">Frequency Scanner</h3>
          </div>
          <Badge variant={isScanning ? "default" : "secondary"}>
            {isScanning ? "SCANNING" : "STANDBY"}
          </Badge>
        </div>

        {/* Scan Controls */}
        <div className="space-y-3 mb-4">
          <Button 
            onClick={onStartScan}
            disabled={isScanning}
            className="w-full"
            data-testid="start-scan-button"
          >
            <Search className="w-4 h-4 mr-2" />
            {isScanning ? 'Scanning...' : 'Start Frequency Scan'}
          </Button>

          {isScanning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Scan Progress</span>
                <span className="text-xs text-muted-foreground">{Math.round(scanProgress)}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="aviation">Aviation</SelectItem>
                <SelectItem value="amateur">Amateur</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="marine">Marine</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="military">Military</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Sort By</label>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="signal">Signal Strength</SelectItem>
                <SelectItem value="frequency">Frequency</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Scanned Frequencies */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Discovered Frequencies</span>
            <Badge variant="outline">{filteredFrequencies.length} found</Badge>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredFrequencies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No frequencies discovered yet</p>
                <p className="text-xs">Start scanning to find active frequencies</p>
              </div>
            ) : (
              filteredFrequencies.map((freq) => (
                <div 
                  key={freq.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    freq.frequency === currentFrequency 
                      ? 'bg-accent border-accent' 
                      : 'bg-secondary hover:bg-accent/50'
                  }`}
                  onClick={() => onFrequencySelect(freq)}
                  data-testid={`scanned-freq-${freq.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm">{freq.frequency.toFixed(3)} MHz</span>
                      <Badge variant="outline" className="text-xs">{freq.modulation}</Badge>
                      {getEncryptionIcon(freq.isEncrypted)}
                      {freq.isEncrypted && (
                        <Badge variant="destructive" className="text-xs">{freq.encryptionType}</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm font-medium">{freq.name}</div>
                    <div className="text-xs text-muted-foreground">{freq.category}</div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      {getSignalIcon(freq.signalStrength)}
                      <span className={`text-xs font-mono ${getSignalStrengthColor(freq.signalStrength)}`}>
                        {freq.signalStrength.toFixed(0)} dBm
                      </span>
                    </div>
                    
                    {freq.isActive && (
                      <Badge variant="default" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 text-xs text-muted-foreground p-2 bg-secondary/50 rounded">
          {isScanning ? (
            <span>🔍 Scanning for active frequencies... Found {scannedFrequencies.length} signals</span>
          ) : scannedFrequencies.length > 0 ? (
            <span>✓ Scan complete - {scannedFrequencies.length} frequencies discovered</span>
          ) : (
            <span>Ready to scan - Click "Start Frequency Scan" to begin</span>
          )}
        </div>
      </div>
    </div>
  );
}
