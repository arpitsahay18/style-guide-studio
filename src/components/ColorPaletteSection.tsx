
import React, { useState } from 'react';
import { useBrandGuide } from '@/context/BrandGuideContext';
import { ColorInput, ColorWithTintsShades } from '@/types';
import { ColorSwatch } from '@/components/ui/ColorSwatch';
import { EnhancedColorForm } from './EnhancedColorForm';
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
import { Trash2, Plus, Edit3, Palette } from 'lucide-react';
import { hexToRgb, rgbToCmyk, generateTints, generateShades } from '@/utils/colorUtils';
import { useToast } from '@/hooks/use-toast';

export function ColorPaletteSection() {
  const { currentGuide, updateColors, colorNames, setColorName } = useBrandGuide();
  const { toast } = useToast();
  const [editingColor, setEditingColor] = useState<{
    category: 'primary' | 'secondary' | 'neutral';
    index: number;
    color: ColorWithTintsShades;
  } | null>(null);
  const [showAddForm, setShowAddForm] = useState<'primary' | 'secondary' | 'neutral' | null>(null);
  const [copiedColor, setCopiedColor] = useState<string>('');

  const handleAddColor = (category: 'primary' | 'secondary' | 'neutral', colorInput: ColorInput) => {
    const rgb = hexToRgb(colorInput.hex);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    
    const newColor: ColorWithTintsShades = {
      hex: colorInput.hex,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
      tints: generateTints(colorInput.hex),
      shades: generateShades(colorInput.hex),
      blackContrast: 0, // These would be calculated in a real app
      whiteContrast: 0
    };

    const updatedColors = {
      ...currentGuide.colors,
      [category]: [...currentGuide.colors[category], newColor]
    };

    updateColors(updatedColors);
    setShowAddForm(null);
    
    toast({
      title: "Color added",
      description: `Added ${colorInput.hex} to ${category} colors.`,
    });
  };

  const handleEditColor = (colorInput: ColorInput) => {
    if (!editingColor) return;

    const rgb = hexToRgb(colorInput.hex);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    
    const updatedColor: ColorWithTintsShades = {
      hex: colorInput.hex,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
      tints: generateTints(colorInput.hex),
      shades: generateShades(colorInput.hex),
      blackContrast: editingColor.color.blackContrast,
      whiteContrast: editingColor.color.whiteContrast
    };

    const updatedColors = {
      ...currentGuide.colors,
      [editingColor.category]: currentGuide.colors[editingColor.category].map((color, index) =>
        index === editingColor.index ? updatedColor : color
      )
    };

    updateColors(updatedColors);
    setEditingColor(null);
    
    toast({
      title: "Color updated",
      description: `Updated color to ${colorInput.hex}.`,
    });
  };

  const handleDeleteColor = (category: 'primary' | 'secondary' | 'neutral', index: number) => {
    const updatedColors = {
      ...currentGuide.colors,
      [category]: currentGuide.colors[category].filter((_, i) => i !== index)
    };

    updateColors(updatedColors);
    
    toast({
      title: "Color removed",
      description: `Removed color from ${category} palette.`,
    });
  };

  const getColorDisplayName = (colorIndex: number, categoryType: 'primary' | 'secondary' | 'neutral') => {
    const colorKey = `${categoryType}-${colorIndex}`;
    const customName = colorNames[colorKey];
    if (customName) return customName;
    const color = currentGuide.colors[categoryType][colorIndex];
    return typeof color === 'string' ? color : color?.hex || 'Unknown Color';
  };

  const handleColorNameChange = (colorIndex: number, categoryType: 'primary' | 'secondary' | 'neutral', newName: string) => {
    const colorKey = `${categoryType}-${colorIndex}`;
    setColorName(colorKey, newName);
  };

  const handleTintShadeClick = (color: string) => {
    navigator.clipboard.writeText(color).then(() => {
      setCopiedColor(color);
      toast({
        title: "Color copied",
        description: `${color} copied to clipboard.`,
      });
      setTimeout(() => setCopiedColor(''), 2000);
    });
  };

  const ColorSection = ({ 
    title, 
    colors, 
    category, 
    canDelete = true 
  }: { 
    title: string; 
    colors: ColorWithTintsShades[]; 
    category: 'primary' | 'secondary' | 'neutral';
    canDelete?: boolean;
  }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>
              {colors.length === 0 
                ? `Add ${title.toLowerCase()} to your brand palette`
                : `${colors.length} color${colors.length !== 1 ? 's' : ''} in your ${title.toLowerCase()} palette`
              }
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddForm(category)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Color
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {colors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No {title.toLowerCase()} added yet</p>
            <p className="text-sm">Click "Add Color" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {colors.map((color, index) => (
              <div key={index} className="space-y-4">
                <div className="space-y-2">
                  <ColorSwatch 
                    color={color} 
                    colorName={getColorDisplayName(index, category)} 
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingColor({ category, index, color })}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {canDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Color</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this color from your {category} palette?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteColor(category, index)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`color-name-${category}-${index}`} className="text-sm font-medium">
                    Color Name
                  </Label>
                  <Input
                    id={`color-name-${category}-${index}`}
                    value={getColorDisplayName(index, category)}
                    onChange={(e) => handleColorNameChange(index, category, e.target.value)}
                    placeholder="Enter color name"
                    className="text-sm"
                  />
                </div>

                <div className="text-xs space-y-1 text-muted-foreground">
                  <p><strong>HEX:</strong> {color.hex}</p>
                  <p><strong>RGB:</strong> {color.rgb}</p>
                  <p><strong>CMYK:</strong> {color.cmyk}</p>
                </div>

                {/* Tints */}
                {color.tints && color.tints.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Tints</Label>
                    <div className="flex flex-wrap gap-1">
                      {color.tints.map((tint, tintIndex) => (
                        <div
                          key={tintIndex}
                          className="relative group cursor-pointer"
                          onClick={() => handleTintShadeClick(tint)}
                          title={`Click to copy ${tint}`}
                        >
                          <div
                            className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                            style={{ backgroundColor: tint }}
                          />
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {copiedColor === tint ? 'Copied!' : tint}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shades */}
                {color.shades && color.shades.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Shades</Label>
                    <div className="flex flex-wrap gap-1">
                      {color.shades.map((shade, shadeIndex) => (
                        <div
                          key={shadeIndex}
                          className="relative group cursor-pointer"
                          onClick={() => handleTintShadeClick(shade)}
                          title={`Click to copy ${shade}`}
                        >
                          <div
                            className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                            style={{ backgroundColor: shade }}
                          />
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {copiedColor === shade ? 'Copied!' : shade}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Color Palette</h1>
          <p className="text-muted-foreground">
            Build your brand's color system with primary, secondary, and neutral colors
          </p>
        </div>

        <ColorSection
          title="Primary Colors"
          colors={currentGuide.colors.primary}
          category="primary"
          canDelete={currentGuide.colors.primary.length > 1}
        />

        <ColorSection
          title="Secondary Colors"
          colors={currentGuide.colors.secondary}
          category="secondary"
          canDelete={currentGuide.colors.secondary.length > 1}
        />

        <ColorSection
          title="Neutral Colors"
          colors={currentGuide.colors.neutral}
          category="neutral"
        />
      </div>

      {/* Add Color Form Dialog */}
      {showAddForm && (
        <EnhancedColorForm
          onSubmit={(color) => handleAddColor(showAddForm, color)}
          onCancel={() => setShowAddForm(null)}
          title={`Add ${showAddForm.charAt(0).toUpperCase() + showAddForm.slice(1)} Color`}
        />
      )}

      {/* Edit Color Form Dialog */}
      {editingColor && (
        <EnhancedColorForm
          onSubmit={handleEditColor}
          onCancel={() => setEditingColor(null)}
          title="Edit Color"
          initialColor={editingColor.color.hex}
        />
      )}
    </div>
  );
}
