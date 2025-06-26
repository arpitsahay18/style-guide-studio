
import React, { useState, useRef, useEffect } from 'react';
import { useBrandGuide } from '@/context/BrandGuideContext';
import { LogoVariation, LogoSet } from '@/types';
import { LogoPreview } from '@/components/ui/LogoPreview';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UploadCloud, 
  AlertCircle, 
  X, 
  Crop, 
  ZoomIn, 
  ZoomOut, 
  Move,
  ArrowRight
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { LogoDropzone } from './LogoDropzone';
import { LogoCropper } from './LogoCropper';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { uploadBase64ToStorage } from '@/utils/firebaseStorage';

interface LogoVariationCreatorProps {
  originalLogo: string;
  onComplete: (variations: LogoVariation[]) => void;
}

function LogoVariationCreator({ originalLogo, onComplete }: LogoVariationCreatorProps) {
  const generateVariations = () => {
    const variations: LogoVariation[] = [];
    
    // Auto-generated variations with 4 backgrounds
    variations.push({
      src: originalLogo,
      background: '#FFFFFF',
      type: 'color'
    });
    
    variations.push({
      src: originalLogo,
      background: '#000000',
      type: 'white'
    });
    
    variations.push({
      src: originalLogo,
      background: '#0062FF',
      type: 'white'
    });
    
    variations.push({
      src: originalLogo,
      background: '#6B7280',
      type: 'white'
    });
    
    onComplete(variations);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Create Logo Variations</h3>
        <p className="text-sm text-muted-foreground">
          We'll create logo variations with different backgrounds: white, black, brand blue, and gray.
        </p>
      </div>
      
      <div className="w-full max-w-xs mx-auto">
        <img 
          src={originalLogo} 
          alt="Original Logo" 
          className="w-full h-auto border border-border rounded-md p-4"
        />
        <p className="text-center text-sm mt-2">Your Uploaded Logo</p>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={generateVariations}>
          Generate Logo Variations
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export function LogoSection() {
  const { currentGuide, updateLogos } = useBrandGuide();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showUploader, setShowUploader] = useState(!currentGuide.logos.original);
  const [showCropper, setShowCropper] = useState(false);
  const [uploadedImage, setUploadedImage] = useState('');
  const [croppedImage, setCroppedImage] = useState('');
  const [showVariationCreator, setShowVariationCreator] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadedImage(e.target.result as string);
        setShowUploader(false);
        setShowCropper(true);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleCropComplete = async (croppedImage: string) => {
    setUploading(true);
    try {
      let logoUrl = croppedImage;
      
      // Dual-mode handling: Firebase Storage for authenticated users, local storage for guests
      if (user) {
        // Upload to Firebase Storage for authenticated users
        logoUrl = await uploadBase64ToStorage(croppedImage, user.uid, 'logo.png');
        toast({
          title: "Logo uploaded to cloud",
          description: "Your logo has been saved to Firebase Storage.",
        });
      } else {
        // Store locally for guest users
        toast({
          title: "Logo saved locally",
          description: "Your logo is saved in this session. Sign in to save permanently.",
        });
      }
      
      const updatedLogos: LogoSet = {
        ...currentGuide.logos,
        original: logoUrl
      };
      
      updateLogos(updatedLogos);
      setCroppedImage(logoUrl);
      setShowCropper(false);
      setShowVariationCreator(true);
      
    } catch (error) {
      console.error('Error handling logo:', error);
      toast({
        variant: "destructive",
        title: "Logo upload failed",
        description: "There was an error saving your logo. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleVariationsComplete = (variations: LogoVariation[]) => {
    const updatedLogos: LogoSet = {
      ...currentGuide.logos,
      square: variations,
      rounded: variations,
      circle: variations
    };
    
    updateLogos(updatedLogos);
    setShowVariationCreator(false);
  };
  
  const handleDeleteLogo = () => {
    const updatedLogos: LogoSet = {
      original: '',
      square: [],
      rounded: [],
      circle: []
    };
    
    updateLogos(updatedLogos);
    setShowUploader(true);
    setShowCropper(false);
    setShowVariationCreator(false);
    setUploadedImage('');
    setCroppedImage('');
  };
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Logo Implementation</CardTitle>
          <CardDescription>
            Upload your logo and create variations for different use cases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showUploader && (
            <LogoDropzone onUpload={handleLogoUpload} />
          )}
          
          {showCropper && (
            <LogoCropper 
              imageUrl={uploadedImage}
              onCrop={handleCropComplete}
              onCancel={() => {
                setShowCropper(false);
                setShowUploader(true);
              }}
              disabled={uploading}
            />
          )}
          
          {uploading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {user ? 'Uploading logo to cloud storage...' : 'Processing logo...'}
              </p>
            </div>
          )}
          
          {showVariationCreator && (
            <LogoVariationCreator 
              originalLogo={croppedImage || currentGuide.logos.original}
              onComplete={handleVariationsComplete}
            />
          )}
          
          {!showUploader && !showCropper && !showVariationCreator && !uploading && currentGuide.logos.original && (
            <div className="space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium mb-2">Your Logo</h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage your logo variations.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Remove Logo
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove your current logo and all variations. You'll need to upload a new logo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteLogo}>
                          Yes, remove logo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              <div>
                <img 
                  src={currentGuide.logos.original}
                  alt="Original Logo"
                  className="w-40 h-40 object-contain border border-border rounded-md p-4 mx-auto"
                />
              </div>
              
              <Tabs defaultValue="square" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-8">
                  <TabsTrigger value="square">Square</TabsTrigger>
                  <TabsTrigger value="rounded">Rounded</TabsTrigger>
                  <TabsTrigger value="circle">Circle</TabsTrigger>
                </TabsList>
                
                <TabsContent value="square" className="animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentGuide.logos.square.map((logo, index) => (
                      <LogoPreview 
                        key={index}
                        logo={logo}
                        shape="square"
                      />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="rounded" className="animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentGuide.logos.rounded.map((logo, index) => (
                      <LogoPreview 
                        key={index}
                        logo={logo}
                        shape="rounded"
                      />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="circle" className="animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentGuide.logos.circle.map((logo, index) => (
                      <LogoPreview 
                        key={index}
                        logo={logo}
                        shape="circle"
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
