'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChangeEvent, forwardRef } from 'react';
import { DayPickerSingleProps } from 'react-day-picker';

interface CategoryOption {
    id: string;
    name: string;
}

interface SimulationFormProps {
    categories: CategoryOption[];
    onSubmit: (data: { name: string; categoryChanges: { categoryId: string; startDate: string; endDate: string; targetAmount: number; }[] }) => void;
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

export function SimulationForm({ categories, onSubmit, onCancel }: SimulationFormProps) {
    const params = useParams();
    const budgetId = params.budgetUuid as string;

    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !categoryId || !targetAmount || !startDate || !endDate) {
            // TODO: Show error message
            return;
        }

        onSubmit({
            name,
            categoryChanges: [{
                categoryId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                targetAmount: parseFloat(targetAmount)
            }]
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Simulation Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    placeholder="e.g., Less Restaurants"
                    required
                />
            </div>

            <div>
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={setCategoryId} value={categoryId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="targetAmount">Target Amount (€)</Label>
                <Input
                    id="targetAmount"
                    type="number"
                    value={targetAmount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTargetAmount(e.target.value)}
                    placeholder="200"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <DatePickerButton className={!startDate ? "text-muted-foreground" : ""}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                            </DatePickerButton>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDate as Date}
                                onSelect={(date: Date | undefined) => date && setStartDate(date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex flex-col space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <DatePickerButton className={!endDate ? "text-muted-foreground" : ""}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                            </DatePickerButton>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={endDate as Date}
                                onSelect={(date: Date | undefined) => date && setEndDate(date)}
                                disabled={(date) =>
                                    startDate ? date < startDate : false
                                }
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">
                    Create Simulation
                </Button>
            </div>
        </form>
    );
} 