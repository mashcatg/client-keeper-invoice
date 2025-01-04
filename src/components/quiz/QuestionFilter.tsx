import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuestionFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  referenceFilter: string;
  onReferenceFilterChange: (value: string) => void;
  references: string[];
}

const QuestionFilter = ({
  searchQuery,
  onSearchChange,
  referenceFilter,
  onReferenceFilterChange,
  references,
}: QuestionFilterProps) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <Label>Search Questions</Label>
          <Input
            type="text"
            placeholder="Search by question text..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="w-64">
          <Label>Filter by Reference</Label>
          <Select
            value={referenceFilter}
            onValueChange={onReferenceFilterChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All References" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All References</SelectItem>
              {references.map((ref) => (
                <SelectItem key={ref} value={ref}>
                  {ref}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default QuestionFilter;