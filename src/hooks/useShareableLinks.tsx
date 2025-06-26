import { useState } from 'react';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { BrandGuide } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useBrandGuide } from '@/context/BrandGuideContext';
import { uploadBase64ToStorage } from '@/utils/firebaseStorage';

interface ShareableLink {
  id: string;
  linkId: string;
  url: string;
  createdAt: Date;
  expiresAt: Date;
  brandGuideName: string;
}

interface OptimizedBrandGuide {
  name: string;
  colors: {
    primary: Array<{ hex: string; rgb: string; cmyk: string }>;
    secondary: Array<{ hex: string; rgb: string; cmyk: string }>;
  };
  typography: any;
  logos: {
    original: string;
    square: Array<{ src: string; background: string; type: string }>;
    rounded: Array<{ src: string; background: string; type: string }>;
    circle: Array<{ src: string; background: string; type: string }>;
  };
}

const optimizeBrandGuideForSharing = async (brandGuide: BrandGuide, colorNames: any, typographyNames: any, typographyVisibility: any, previewText: string, userId: string): Promise<OptimizedBrandGuide> => {
  // Handle logo upload to Firebase Storage if it's base64
  let logoUrl = brandGuide.logos.original;
  if (logoUrl && logoUrl.startsWith('data:image/')) {
    try {
      logoUrl = await uploadBase64ToStorage(logoUrl, userId, 'shared-logo');
    } catch (error) {
      console.error('Error uploading logo to storage:', error);
      // Keep original base64 as fallback
    }
  }

  // Create an optimized version with only essential data
  const optimized: OptimizedBrandGuide = {
    name: brandGuide.name,
    colors: {
      primary: brandGuide.colors.primary.map(color => ({
        hex: color.hex,
        rgb: color.rgb,
        cmyk: color.cmyk
      })),
      secondary: brandGuide.colors.secondary.map(color => ({
        hex: color.hex,
        rgb: color.rgb,
        cmyk: color.cmyk
      }))
    },
    typography: brandGuide.typography,
    logos: {
      original: logoUrl,
      square: brandGuide.logos.square.map(logo => ({
        src: logo.src,
        background: logo.background,
        type: logo.type
      })),
      rounded: brandGuide.logos.rounded.map(logo => ({
        src: logo.src,
        background: logo.background,
        type: logo.type
      })),
      circle: brandGuide.logos.circle.map(logo => ({
        src: logo.src,
        background: logo.background,
        type: logo.type
      }))
    }
  };

  return optimized;
};

const checkDataSize = (data: any): boolean => {
  const sizeInBytes = new TextEncoder().encode(JSON.stringify(data)).length;
  console.log('Data size:', sizeInBytes, 'bytes');
  return sizeInBytes < 1000000; // 1MB limit
};

export const useShareableLinks = () => {
  const [links, setLinks] = useState<ShareableLink[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    colorNames, 
    typographyNames, 
    typographyVisibility, 
    previewText
  } = useBrandGuide();

  const fetchLinks = async () => {
    if (!user) {
      setLinks([]);
      return;
    }
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'shareableLinks'),
        where('userId', '==', user.uid),
        where('expiresAt', '>', Timestamp.now()),
        orderBy('expiresAt', 'desc'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedLinks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          linkId: data.linkId,
          url: `${window.location.origin}/s/${data.linkId}`,
          createdAt: data.createdAt.toDate(),
          expiresAt: data.expiresAt.toDate(),
          brandGuideName: data.brandGuide?.name || 'Untitled Brand Guide'
        };
      }) as ShareableLink[];
      
      setLinks(fetchedLinks);
    } catch (error) {
      console.error('Error fetching links:', error);
      toast({
        variant: "destructive",
        title: "Error fetching links",
        description: "Could not load your shareable links.",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateShareableLink = async (brandGuide: BrandGuide) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to generate shareable links.",
      });
      return null;
    }

    if (!brandGuide.colors.primary.length || !brandGuide.colors.secondary.length || !brandGuide.logos.original) {
      toast({
        variant: "destructive",
        title: "Incomplete brand guide",
        description: "Please add primary colors, secondary colors, and a logo before sharing.",
      });
      return null;
    }

    try {
      setLoading(true);
      
      // Generate unique link ID
      const linkId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Set expiration to 72 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);

      // Optimize brand guide data
      const optimizedBrandGuide = await optimizeBrandGuideForSharing(
        brandGuide, 
        colorNames, 
        typographyNames, 
        typographyVisibility, 
        previewText,
        user.uid
      );

      const linkData = {
        userId: user.uid,
        linkId,
        brandGuide: optimizedBrandGuide,
        colorNames: colorNames || {},
        typographyNames: typographyNames || {},
        typographyVisibility: typographyVisibility || {
          display: ['large', 'regular'],
          heading: ['h1', 'h2', 'h3'],
          body: ['large', 'medium', 'small']
        },
        previewText: previewText || 'The quick brown fox jumps over the lazy dog',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt)
      };

      // Check data size before saving
      if (!checkDataSize(linkData)) {
        throw new Error('Brand guide data is too large for sharing. Please reduce the size of your assets.');
      }

      console.log('Creating shareable link with optimized data:', linkData);

      await addDoc(collection(db, 'shareableLinks'), linkData);
      
      const shareableUrl = `${window.location.origin}/s/${linkId}`;
      
      // Refresh links list
      await fetchLinks();
      
      return shareableUrl;
    } catch (error) {
      console.error('Error generating link:', error);
      toast({
        variant: "destructive",
        title: "Failed to generate link",
        description: error instanceof Error ? error.message : "There was an error creating the shareable link. Please try again.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      await deleteDoc(doc(db, 'shareableLinks', linkId));
      toast({
        title: "Link deleted",
        description: "The shareable link has been removed.",
      });
      await fetchLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete link",
        description: "There was an error removing the link.",
      });
    }
  };

  const copyLinkToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Could not copy link to clipboard.",
      });
    }
  };

  return {
    links,
    loading,
    generateShareableLink,
    deleteLink,
    copyLinkToClipboard,
    fetchLinks
  };
};
