import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/Accordion';
import { Alert } from '~/components/ui/Alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '~/components/ui/AlertDialog';
import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { Calendar } from '~/components/ui/Calendar';
import { Card, CardActions, CardBody, CardTitle } from '~/components/ui/Card';
import { Checkbox } from '~/components/ui/Checkbox';
import { DatePicker } from '~/components/ui/DatePicker';
import { DateRangePicker } from '~/components/ui/DateRangePicker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/DropdownMenu';
import { EmptyState } from '~/components/ui/EmptyState';
import { ErrorState } from '~/components/ui/ErrorState';
import { FormActions } from '~/components/ui/FormActions';
import { FormField } from '~/components/ui/FormField';
import { GridContainer } from '~/components/ui/GridContainer';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { PageContainer } from '~/components/ui/PageContainer';
import { PageHeader } from '~/components/ui/PageHeader';
import { Progress } from '~/components/ui/Progress';
import { RadioGroup, RadioGroupItem } from '~/components/ui/RadioGroup';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/Select';
import { Separator } from '~/components/ui/Separator';
import { Skeleton } from '~/components/ui/Skeleton';
import { Slider } from '~/components/ui/Slider';
import { Status } from '~/components/ui/Status';
import { Stepper } from '~/components/ui/Stepper';
import { Sticker } from '~/components/ui/Sticker';
import { Switch } from '~/components/ui/Switch';
import { TabItem, Tabs } from '~/components/ui/Tabs';
import { Textarea } from '~/components/ui/Textarea';
import { Toggle } from '~/components/ui/Toggle';
import { ToggleGroup } from '~/components/ui/ToggleGroup';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/Tooltip';

export const Route = createFileRoute('/component-showcase')({
  component: ComponentShowcase,
});

const ComponentShowcase = () => {
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [sliderValue, setSliderValue] = useState([50]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [dataType, setDataType] = useState('categorical');
  const [dialogSelectValue, setDialogSelectValue] = useState('option1');

  return (
    <PageContainer>
      <PageHeader
        title="Component Showcase"
        description="Testing and visual verification of all UI components"
      />

      <div className="space-y-12 pb-12">
        {/* Buttons Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Buttons</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Button Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="error">Error</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="info">Info</Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Button Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Button States</h3>
              <div className="flex flex-wrap gap-4">
                <Button isLoading>Loading</Button>
                <Button isDisabled>Disabled</Button>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Badges Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="ghost">Ghost</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="neutral">Neutral</Badge>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Badge Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Badge size="xs">Extra Small</Badge>
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Outline Badges</h3>
            <div className="flex flex-wrap gap-4">
              <Badge variant="primary" outline>Primary</Badge>
              <Badge variant="secondary" outline>Secondary</Badge>
              <Badge variant="success" outline>Success</Badge>
              <Badge variant="error" outline>Error</Badge>
            </div>
          </div>
        </section>

        <Separator />

        {/* Cards Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardBody>
                <CardTitle>Card Title</CardTitle>
                <p className="text-sm text-base-content/70 mb-4">Card description goes here</p>
                <p>This is the card content area where you can put any content.</p>
                <CardActions>
                  <Button variant="primary" size="sm">Action</Button>
                </CardActions>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <CardTitle>Another Card</CardTitle>
                <p className="text-sm text-base-content/70 mb-4">With different content</p>
                <p>Cards can contain various types of content and are very flexible.</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <CardTitle>Simple Card</CardTitle>
                <p>A minimal card example.</p>
              </CardBody>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Form Controls Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Form Controls</h2>
          
          <div className="space-y-6 max-w-2xl">
            <FormField label="Input Field" description="This is a standard input field">
              <Input placeholder="Enter text here..." />
            </FormField>

            <FormField label="Password Input">
              <Input type="password" placeholder="Enter password..." />
            </FormField>

            <FormField label="Textarea" description="For longer text input">
              <Textarea placeholder="Enter multiple lines of text..." rows={4} />
            </FormField>

            <FormField label="Select Dropdown">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Data Type Select" description="Used in tag dimension creation">
              <Select value={dataType} onValueChange={setDataType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="categorical">Categorical</SelectItem>
                  <SelectItem value="numerical">Numerical</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <div className="flex items-center gap-2">
              <Checkbox
                id="checkbox-demo"
                checked={checkboxChecked}
                onCheckedChange={setCheckboxChecked}
              />
              <Label htmlFor="checkbox-demo">Checkbox Example</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="switch-demo"
                checked={switchChecked}
                onCheckedChange={setSwitchChecked}
              />
              <Label htmlFor="switch-demo">Switch Example</Label>
            </div>

            <FormField label="Radio Group">
              <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="option1" id="radio1" />
                  <Label htmlFor="radio1">Option 1</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="option2" id="radio2" />
                  <Label htmlFor="radio2">Option 2</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="option3" id="radio3" />
                  <Label htmlFor="radio3">Option 3</Label>
                </div>
              </RadioGroup>
            </FormField>

            <FormField label="Slider">
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-sm text-muted-foreground mt-2">Value: {sliderValue[0]}</p>
            </FormField>

            <FormActions>
              <Button variant="ghost">Cancel</Button>
              <Button variant="primary">Submit</Button>
            </FormActions>
          </div>
        </section>

        <Separator />

        {/* Date & Time Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Date & Time</h2>
          <div className="space-y-6 max-w-md">
            <div>
              <h3 className="text-lg font-semibold mb-2">Calendar</h3>
              <Calendar mode="single" selected={date} onSelect={setDate} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Date Picker</h3>
              <DatePicker date={date} setDate={setDate} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Date Range Picker</h3>
              <DateRangePicker />
            </div>
          </div>
        </section>

        <Separator />

        {/* Alerts & Status Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Alerts & Status</h2>
          <div className="space-y-4 max-w-2xl">
            <Alert variant="info" title="Information">
              This is an informational alert message.
            </Alert>
            <Alert variant="success" title="Success">
              This is a success alert message.
            </Alert>
            <Alert variant="warning" title="Warning">
              This is a warning alert message.
            </Alert>
            <Alert variant="error" title="Error">
              This is an error alert message.
            </Alert>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Status Indicators</h3>
            <div className="flex flex-wrap gap-4">
              <Status status="active">Active</Status>
              <Status status="pending">Pending</Status>
              <Status status="inactive">Inactive</Status>
              <Status status="error">Error</Status>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Sticker Display</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Stickers are used to display compact information on media tiles and posts
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Color Dots (Multiple colors in one sticker)</p>
                <div className="flex flex-wrap gap-2">
                  <Sticker>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
                  </Sticker>
                  <Sticker>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
                  </Sticker>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Short Text Stickers</p>
                <div className="flex flex-wrap gap-2">
                  <Sticker className="text-xs">HD</Sticker>
                  <Sticker className="text-xs">NEW</Sticker>
                  <Sticker className="text-xs">4K</Sticker>
                  <Sticker className="text-xs">Solo</Sticker>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Mixed Example (As seen on media tiles)</p>
                <div className="flex flex-wrap gap-2">
                  <Sticker>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                  </Sticker>
                  <Sticker className="text-xs">HD</Sticker>
                  <Sticker className="text-xs">BG</Sticker>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Progress & Loading Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Progress & Loading</h2>
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-semibold mb-2">Progress Bar</h3>
              <Progress value={33} className="mb-2" />
              <Progress value={66} className="mb-2" />
              <Progress value={100} />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Skeleton Loaders</h3>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>

          </div>
        </section>

        <Separator />

        {/* Dialogs & Modals Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Dialogs & Modals</h2>
          <div className="flex gap-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog Title</DialogTitle>
                  <DialogDescription>
                    This is a dialog description. You can put any content here.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p>Dialog content goes here.</p>
                  <FormField label="Select in Dialog" description="Test z-index fix - dropdown should appear above dialog">
                    <Select value={dialogSelectValue} onValueChange={setDialogSelectValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                        <SelectItem value="option2">Option 2</SelectItem>
                        <SelectItem value="option3">Option 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onPress={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onPress={() => setDialogOpen(false)}>
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button onPress={() => setAlertDialogOpen(true)}>Open Alert Dialog</Button>
            
            <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the item.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setAlertDialogOpen(false)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={() => setAlertDialogOpen(false)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        <Separator />

        {/* Dropdown & Menus Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Dropdowns & Menus</h2>
          <div className="flex gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>Open Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button>Hover for Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a tooltip!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </section>

        <Separator />

        {/* Tabs Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Tabs</h2>
          <Tabs aria-label="Example tabs" className="max-w-2xl">
            <TabItem key="tab1" title="Tab 1">
              <Card>
                <CardBody>
                  <p>Content for Tab 1</p>
                </CardBody>
              </Card>
            </TabItem>
            <TabItem key="tab2" title="Tab 2">
              <Card>
                <CardBody>
                  <p>Content for Tab 2</p>
                </CardBody>
              </Card>
            </TabItem>
            <TabItem key="tab3" title="Tab 3">
              <Card>
                <CardBody>
                  <p>Content for Tab 3</p>
                </CardBody>
              </Card>
            </TabItem>
          </Tabs>
        </section>

        <Separator />

        {/* Accordion Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Accordion</h2>
          <Accordion type="single" collapsible className="max-w-2xl">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                <button className="w-full text-left px-4 py-3 font-medium hover:bg-base-200 rounded-t-lg">
                  Accordion Item 1
                </button>
              </AccordionTrigger>
              <AccordionContent>
                This is the content for accordion item 1. It can contain any content.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>
                <button className="w-full text-left px-4 py-3 font-medium hover:bg-base-200">
                  Accordion Item 2
                </button>
              </AccordionTrigger>
              <AccordionContent>
                This is the content for accordion item 2. You can expand multiple items if type is "multiple".
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>
                <button className="w-full text-left px-4 py-3 font-medium hover:bg-base-200 rounded-b-lg">
                  Accordion Item 3
                </button>
              </AccordionTrigger>
              <AccordionContent>
                This is the content for accordion item 3. Click to toggle visibility.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* Table Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Table</h2>
          <div className="max-w-4xl overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">John Doe</td>
                  <td>
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td>Admin</td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Jane Smith</td>
                  <td>
                    <Badge variant="warning">Pending</Badge>
                  </td>
                  <td>User</td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Bob Johnson</td>
                  <td>
                    <Badge variant="error">Inactive</Badge>
                  </td>
                  <td>User</td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <Separator />

        {/* Stepper Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Stepper</h2>
          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Horizontal Stepper</h3>
              <Stepper
                currentStep={1}
                steps={[
                  { label: 'Step 1', description: 'First step' },
                  { label: 'Step 2', description: 'Current step' },
                  { label: 'Step 3', description: 'Final step' },
                ]}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Vertical Stepper</h3>
              <Stepper
                currentStep={1}
                orientation="vertical"
                steps={[
                  { label: 'Account Setup', description: 'Create your account' },
                  { label: 'Profile Information', description: 'Add your details' },
                  { label: 'Verification', description: 'Verify your email' },
                  { label: 'Complete', description: 'All done!' },
                ]}
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Toggle Group Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Toggle & Toggle Group</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Toggle</h3>
              <Toggle>Toggle Me</Toggle>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Toggle Group (Default)</h3>
              <ToggleGroup
                aria-label="Text alignment"
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Center' },
                  { value: 'right', label: 'Right' },
                ]}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Toggle Group (Primary)</h3>
              <ToggleGroup
                aria-label="View mode"
                variant="primary"
                options={[
                  { value: 'grid', label: 'Grid' },
                  { value: 'list', label: 'List' },
                  { value: 'table', label: 'Table' },
                ]}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Toggle Group (Outline)</h3>
              <ToggleGroup
                aria-label="Size"
                variant="outline"
                size="sm"
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Empty & Error States Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Empty & Error States</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Empty State</h3>
              <EmptyState
                title="No Items Found"
                description="There are no items to display at this time."
                action={<Button>Add Item</Button>}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Error State</h3>
              <ErrorState
                title="Something Went Wrong"
                description="We encountered an error while loading the content."
                action={<Button>Try Again</Button>}
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Grid Container Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Grid Container</h2>
          <GridContainer>
            <Card>
              <CardBody>Grid Item 1</CardBody>
            </Card>
            <Card>
              <CardBody>Grid Item 2</CardBody>
            </Card>
            <Card>
              <CardBody>Grid Item 3</CardBody>
            </Card>
            <Card>
              <CardBody>Grid Item 4</CardBody>
            </Card>
            <Card>
              <CardBody>Grid Item 5</CardBody>
            </Card>
            <Card>
              <CardBody>Grid Item 6</CardBody>
            </Card>
          </GridContainer>
        </section>

        <Separator />

        {/* Scroll Area Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Scroll Area</h2>
          <ScrollArea className="h-48 max-w-2xl border rounded-md p-4">
            <div className="space-y-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="text-sm">
                  Scrollable item {i + 1}
                </div>
              ))}
            </div>
          </ScrollArea>
        </section>
      </div>
    </PageContainer>
  );
};

