'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChangeEvent, forwardRef } from 'react';

interface CategoryOption {
    uuid: string;
    name: string;
}

interface CategoryChange {
    categoryUuid: string;
    startDate?: string;
    endDate?: string;
    targetAmount: number;
}

interface CategoryChangesFormProps {
    categories: CategoryOption[];
    initialChanges?: CategoryChange[];
    onSubmit: (changes: CategoryChange[]) => void;
    onCancel: () => void;
}

const DatePickerButton = forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
    ({ className, ...props }, ref) => (
        <Button
            ref={ref}
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", className)}
            {...props}
        />
    )
);
DatePickerButton.displayName = "DatePickerButton";

export function CategoryChangesForm({ categories, initialChanges = [], onSubmit, onCancel }: CategoryChangesFormProps) {
    const [changes, setChanges] = useState<CategoryChange[]>(initialChanges);

    const addChange = () => {
        setChanges([...changes, {
            categoryUuid: '',
            targetAmount: 0
        }]);
    };

    const removeChange = (index: number) => {
        setChanges(changes.filter((_, i) => i !== index));
    };

    const updateChange = (index: number, field: keyof CategoryChange, value: any) => {
        const newChanges = [...changes];
        newChanges[index] = { ...newChanges[index], [field]: value };
        setChanges(newChanges);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(changes);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
                {changes.map((change, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">Category Change {index + 1}</h3>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeChange(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div>
                            <Label htmlFor={`category-${index}`}>Category</Label>
                            <Select
                                value={change.categoryUuid}
                                onValueChange={(value) => updateChange(index, 'categoryUuid', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.uuid} value={category.uuid}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor={`targetAmount-${index}`}>Target Amount (€)</Label>
                            <Input
                                id={`targetAmount-${index}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={change.targetAmount}
                                onChange={(e) => updateChange(index, 'targetAmount', parseFloat(e.target.value))}
                                placeholder="200"
                                required
                                inputMode="decimal"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-2">
                                <Label>Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <DatePickerButton className={!change.startDate ? "text-muted-foreground" : ""}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {change.startDate ? format(new Date(change.startDate), "PPP") : <span>Pick a date</span>}
                                        </DatePickerButton>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={change.startDate ? new Date(change.startDate) : undefined}
                                            onSelect={(date) => date && updateChange(index, 'startDate', date.toISOString())}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <Label>End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <DatePickerButton className={!change.endDate ? "text-muted-foreground" : ""}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {change.endDate ? format(new Date(change.endDate), "PPP") : <span>Pick a date</span>}
                                        </DatePickerButton>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={change.endDate ? new Date(change.endDate) : undefined}
                                            onSelect={(date) => date && updateChange(index, 'endDate', date.toISOString())}
                                            disabled={(date) =>
                                                change.startDate ? date < new Date(change.startDate) : false
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Button type="button" variant="outline" onClick={addChange} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Category Change
            </Button>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">
                    Save Changes
                </Button>
            </div>
        </form>
    );
} 