
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  colorHex: string;
  onSave: (newName: string) => void;
}

export const ColorNameDialog: React.FC<ColorNameDialogProps> = ({
  open,
  onOpenChange,
  currentName,
  colorHex,
  onSave,
}) => {
  const [name, setName] = useState(currentName);

  const handleSave = () => {
    onSave(name.trim() || colorHex);
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Color</DialogTitle>
          <DialogDescription>
            Give this color a custom name for your brand guide.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-md border border-gray-200"
              style={{ backgroundColor: colorHex }}
            />
            <div>
              <Label htmlFor="color-name">Color Name</Label>
              <Input
                id="color-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={colorHex}
                className="mt-1"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
