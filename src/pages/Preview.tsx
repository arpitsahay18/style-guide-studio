
import React, { useRef } from 'react';
import { useBrandGuide } from '@/context/BrandGuideContext';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { FileDown, ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { convertImageToBase64, pdfStyles } from '@/utils/pdfExportUtils';

const Preview = () => {
  const navigate = useNavigate();
  const { currentGuide, colorNames, typographyNames, typographyVisibility, previewText } = useBrandGuide();
  const { toast } = useToast();
  const { user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to export your brand guide as PDF.",
        variant: "destructive"
      });
      return;
    }

    if (!contentRef.current) return;

    try {
      toast({
        title: "Generating PDF",
        description: "Creating your brand guide PDF..."
      });

      // Convert Firebase image URLs to base64 if needed
      let logoBase64 = '';
      if (currentGuide.logos.original) {
        logoBase64 = await convertImageToBase64(currentGuide.logos.original);
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // Add CSS for better page breaks
      const styleElement = document.createElement('style');
      styleElement.textContent = pdfStyles;
      document.head.appendChild(styleElement);

      // Title Page
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      if (logoBase64) {
        try {
          pdf.addImage(logoBase64, 'PNG', pageWidth / 2 - 20, 80, 40, 40);
        } catch (error) {
          console.error('Error adding logo to PDF:', error);
        }
      }
      
      pdf.setFontSize(42);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(currentGuide.name, pageWidth / 2, 150, { align: 'center' });
      
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Brand Guidelines', pageWidth / 2, 170, { align: 'center' });

      // Capture content sections with better page break handling
      const sections = contentRef.current.querySelectorAll('.pdf-section');
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        
        pdf.addPage();
        
        try {
          const canvas = await html2canvas(section, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            height: section.scrollHeight,
            windowHeight: section.scrollHeight
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.9);
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * contentWidth) / canvas.width;
          
          // Handle content that's too tall for one page
          if (imgHeight > pageHeight - margin * 2) {
            let yPosition = 0;
            const maxHeight = pageHeight - margin * 2;
            
            while (yPosition < imgHeight) {
              if (yPosition > 0) pdf.addPage();
              
              const remainingHeight = Math.min(maxHeight, imgHeight - yPosition);
              pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, remainingHeight, undefined, 'FAST');
              
              yPosition += maxHeight;
            }
          } else {
            pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
          }
        } catch (sectionError) {
          console.error('Error capturing section:', sectionError);
        }
      }

      // Clean up added styles
      document.head.removeChild(styleElement);

      pdf.save(`${currentGuide.name.replace(/\s+/g, '_')}_brand_guide.pdf`);

      toast({
        title: "PDF Generated Successfully",
        description: "Your brand guide has been downloaded."
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Error Generating PDF",
        description: "There was a problem generating your PDF. Please try again."
      });
    }
  };

  const getColorDisplayName = (colorIndex: number, categoryType: 'primary' | 'secondary' | 'neutral') => {
    const colorKey = `${categoryType}-${colorIndex}`;
    return colorNames[colorKey] || currentGuide.colors[categoryType][colorIndex]?.hex || 'Unknown Color';
  };

  const getTypographyDisplayName = (category: string, styleKey: string) => {
    const key = `${category}-${styleKey}`;
    return typographyNames[key] || styleKey;
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-white">
        {/* Sticky Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Editor
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentGuide.name}</h1>
                <p className="text-gray-600">Brand Guidelines</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF} className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                Save as PDF
              </Button>
              <Button className="flex items-center gap-2">
                Share Link
              </Button>
            </div>
          </div>
        </div>

        {/* Brand Guide Content */}
        <div ref={contentRef} className="container mx-auto px-4 py-8 space-y-16">
          
          {/* Brand Header */}
          <div className="pdf-section text-center py-12 pdf-no-break">
            {currentGuide.logos?.original && (
              <div className="mb-8">
                <img 
                  src={currentGuide.logos.original} 
                  alt={`${currentGuide.name} Logo`}
                  className="h-24 mx-auto object-contain"
                />
              </div>
            )}
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{currentGuide.name}</h1>
            <p className="text-xl text-gray-600">Brand Guidelines</p>
          </div>

          {/* Typography Section */}
          {Object.keys(currentGuide.typography || {}).length > 0 && (
            <section className="pdf-section">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Typography</h2>
              
              {Object.entries(currentGuide.typography).map(([category, styles]) => (
                <div key={category} className="mb-12 pdf-no-break">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6 capitalize">{category} {category === 'display' ? 'Typography' : category === 'heading' ? '' : 'Text'}</h3>
                  <div className="space-y-6">
                    {typographyVisibility[category as keyof typeof typographyVisibility]?.map((styleKey) => {
                      const style = styles[styleKey as keyof typeof styles];
                      if (!style) return null;
                      
                      return (
                        <div key={styleKey} className="pdf-typography-sample">
                          <div className="flex items-start gap-8">
                            <div className="w-48 flex-shrink-0">
                              <div className="text-left border-l-4 border-blue-500 pl-4">
                                <h4 className="text-lg font-medium text-gray-900 mb-1">
                                  {getTypographyDisplayName(category, styleKey)}
                                </h4>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>{style.fontFamily?.replace(/['"]/g, '').split(',')[0]}</p>
                                  <p>{style.fontSize} • {style.fontWeight}</p>
                                  <p>{style.lineHeight} • {style.letterSpacing}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <p 
                                className="text-gray-800"
                                style={{ 
                                  fontFamily: style.fontFamily,
                                  fontSize: style.fontSize,
                                  fontWeight: style.fontWeight,
                                  lineHeight: style.lineHeight,
                                  letterSpacing: style.letterSpacing
                                }}
                              >
                                {previewText}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Color Palette */}
          {(currentGuide.colors?.primary?.length > 0 || currentGuide.colors?.secondary?.length > 0) && (
            <section className="pdf-section pdf-no-break">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Color Palette</h2>
              
              {currentGuide.colors.primary?.length > 0 && (
                <div className="mb-12 pdf-no-break">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Primary Colors</h3>
                  <div className="grid grid-cols-3 gap-6">
                    {currentGuide.colors.primary.map((color, index) => (
                      <div key={index} className="text-center pdf-no-break">
                        <div 
                          className="w-full h-32 rounded-lg border border-gray-200 mb-3"
                          style={{ backgroundColor: color.hex }}
                        ></div>
                        <p className="font-medium text-gray-900 mb-1">
                          {getColorDisplayName(index, 'primary')}
                        </p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="font-mono">HEX: {color.hex}</p>
                          <p>RGB: {color.rgb}</p>
                          <p>CMYK: {color.cmyk}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentGuide.colors.secondary?.length > 0 && (
                <div className="pdf-no-break">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Secondary Colors</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {currentGuide.colors.secondary.map((color, index) => (
                      <div key={index} className="text-center pdf-no-break">
                        <div 
                          className="w-full h-24 rounded-lg border border-gray-200 mb-3"
                          style={{ backgroundColor: color.hex }}
                        ></div>
                        <p className="font-medium text-gray-900 mb-1">
                          {getColorDisplayName(index, 'secondary')}
                        </p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="font-mono">HEX: {color.hex}</p>
                          <p>RGB: {color.rgb}</p>
                          <p>CMYK: {color.cmyk}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Logo Section */}
          {currentGuide.logos?.original && (
            <section className="pdf-section pdf-no-break">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Logo</h2>
              
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Primary Logo</h3>
                <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                  <img 
                    src={currentGuide.logos.original} 
                    alt={`${currentGuide.name} Logo`}
                    className="h-32 mx-auto object-contain mb-4"
                  />
                </div>
              </div>

              {/* Logo Variations */}
              {(currentGuide.logos.square?.length > 0 || currentGuide.logos.rounded?.length > 0 || currentGuide.logos.circle?.length > 0) && (
                <div className="pdf-no-break">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Logo Variations</h3>
                  
                  {currentGuide.logos.square?.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-gray-700 mb-4">Square</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {currentGuide.logos.square.map((logo, index) => (
                          <div key={index} className="text-center">
                            <div 
                              className="w-20 h-20 mx-auto rounded border border-gray-200 flex items-center justify-center mb-2"
                              style={{ backgroundColor: logo.background === 'transparent' ? '#f3f4f6' : logo.background }}
                            >
                              <img 
                                src={logo.src} 
                                alt={`Square logo ${index + 1}`}
                                className="max-w-12 max-h-12 object-contain"
                              />
                            </div>
                            <p className="text-xs text-gray-600 capitalize">{logo.background} Background</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentGuide.logos.rounded?.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-gray-700 mb-4">Rounded</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {currentGuide.logos.rounded.map((logo, index) => (
                          <div key={index} className="text-center">
                            <div 
                              className="w-20 h-20 mx-auto rounded-lg border border-gray-200 flex items-center justify-center mb-2"
                              style={{ backgroundColor: logo.background === 'transparent' ? '#f3f4f6' : logo.background }}
                            >
                              <img 
                                src={logo.src} 
                                alt={`Rounded logo ${index + 1}`}
                                className="max-w-12 max-h-12 object-contain"
                              />
                            </div>
                            <p className="text-xs text-gray-600 capitalize">{logo.background} Background</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentGuide.logos.circle?.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-gray-700 mb-4">Circle</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {currentGuide.logos.circle.map((logo, index) => (
                          <div key={index} className="text-center">
                            <div 
                              className="w-20 h-20 mx-auto rounded-full border border-gray-200 flex items-center justify-center mb-2"
                              style={{ backgroundColor: logo.background === 'transparent' ? '#f3f4f6' : logo.background }}
                            >
                              <img 
                                src={logo.src} 
                                alt={`Circle logo ${index + 1}`}
                                className="max-w-12 max-h-12 object-contain"
                              />
                            </div>
                            <p className="text-xs text-gray-600 capitalize">{logo.background} Background</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

        </div>
      </div>
    </MainLayout>
  );
};

export default Preview;
