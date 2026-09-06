import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { Button as NativeButton, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthContext } from '@/lib/auth';
import { useTheme } from '@/lib/bootstrap/ThemeProvider';
import { BackButton as BackButtonPrimitive } from '@/lib/components/ui/BackButton';
import { Badge as BadgePrimitive } from '@/lib/components/ui/Badge';
import { BottomSheet as BottomSheetPrimitive } from '@/lib/components/ui/BottomSheet';
import { Button as ButtonPrimitive } from '@/lib/components/ui/Button';
import { ChipGroup as ChipGroupPrimitive } from '@/lib/components/ui/ChipGroup';
import { Combobox as ComboboxPrimitive } from '@/lib/components/ui/Combobox';
import { DataTable as DataTablePrimitive } from '@/lib/components/ui/DataTable';
import { useDialog } from '@/lib/components/ui/Dialog';
import { DirectionPicker as DirectionPickerPrimitive } from '@/lib/components/ui/DirectionPicker';
import { EmptyState as EmptyStatePrimitive } from '@/lib/components/ui/EmptyState';
import { FormField as FormFieldPrimitive } from '@/lib/components/ui/FormField';
import { InfoButton as InfoButtonPrimitive } from '@/lib/components/ui/InfoButton';
import { Markdown as MarkdownPrimitive } from '@/lib/components/ui/Markdown';
import { PieChart as PieChartPrimitive } from '@/lib/components/ui/PieChart';
import { PlayerSelectionCard as PlayerSelectionCardPrimitive } from '@/lib/components/ui/PlayerSelectionCard';
import { ResizableTextInput as ResizableTextInputPrimitive } from '@/lib/components/ui/ResizableTextInput';
import { SearchInput as SearchInputPrimitive } from '@/lib/components/ui/SearchInput';
import { SelectPicker as SelectPickerPrimitive } from '@/lib/components/ui/SelectPicker';
import { type as typography } from '@/lib/theme/typography';

const meta = { title: 'Primitives' } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live', isLive: true },
  { value: 'done', label: 'Finished', icon: 'checkmark-circle-outline' },
] as const;

function BottomSheetExample() {
  const [visible, setVisible] = useState(true);
  return (
    <>
      <NativeButton title="Open bottom sheet" onPress={() => setVisible(true)} />
      <BottomSheetPrimitive
        visible={visible}
        onClose={() => setVisible(false)}
        title="Round settings"
        footer={<NativeButton title="Save" onPress={() => setVisible(false)} />}
      >
        <Text>Bottom-sheet content belongs here.</Text>
      </BottomSheetPrimitive>
    </>
  );
}

function ChipGroupExample() {
  const [selected, setSelected] = useState<(typeof options)[number]['value']>('all');
  const [cycled, setCycled] = useState<(typeof options)[number]['value']>('all');
  return (
    <View style={styles.stack}>
      <ChipGroupPrimitive mode="select" options={[...options]} value={selected} onChange={setSelected} />
      <ChipGroupPrimitive mode="cycle" options={[...options]} value={cycled} onChange={setCycled} />
    </View>
  );
}

function ComboboxExample() {
  const [value, setValue] = useState<(typeof options)[number]['value']>('live');
  return <ComboboxPrimitive options={[...options]} value={value} onChange={setValue} />;
}

function DialogExample() {
  const { confirm } = useDialog();
  return (
    <NativeButton
      title="Open dialog"
      onPress={() => confirm({ title: 'Delete result?', message: 'This cannot be undone.', destructive: true })}
    />
  );
}

function DirectionPickerExample() {
  const [value, setValue] = useState<'up' | 'down'>('down');
  return <DirectionPickerPrimitive value={value} onChange={setValue} labelDown="Count down" labelUp="Count up" />;
}

function FormFieldExample() {
  const { colors } = useTheme();
  return (
    <FormFieldPrimitive icon="person-outline" label="Player name" required error="A name is required">
      <TextInput
        placeholder="Ada Lovelace"
        placeholderTextColor={colors.textPlaceholder}
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      />
    </FormFieldPrimitive>
  );
}

function ResizableTextInputExample() {
  const [value, setValue] = useState('Drag the handle to resize this field.');
  return <ResizableTextInputPrimitive value={value} onChangeText={setValue} resetOn={false} style={styles.input} />;
}

function SearchInputExample() {
  const [value, setValue] = useState('Catan');
  return <SearchInputPrimitive value={value} onChangeText={setValue} placeholder="Search games" />;
}

function SelectPickerExample() {
  const [value, setValue] = useState<(typeof options)[number]['value']>('all');
  return <SelectPickerPrimitive options={[...options]} value={value} onChange={setValue} />;
}

export const BackButton: Story = {
  render: () => <BackButtonPrimitive onPress={() => {}} />,
};

export const Badge: Story = {
  render: () => (
    <View style={styles.row}>
      <BadgePrimitive label="Pending" />
      <BadgePrimitive label="In progress" tone="info" />
      <BadgePrimitive label="Submitted" tone="success" />
      <BadgePrimitive label="2 signatures" tone="warning" />
      <BadgePrimitive label="Overtime" tone="danger" />
    </View>
  ),
};

export const Button: Story = {
  render: () => (
    <View style={styles.stack}>
      <ButtonPrimitive label="Start round" icon="play" onPress={() => {}} />
      <ButtonPrimitive label="Save draft" variant="secondary" onPress={() => {}} />
      <ButtonPrimitive label="View rules" variant="ghost" onPress={() => {}} />
      <ButtonPrimitive label="Delete result" variant="danger" icon="trash-outline" onPress={() => {}} />
      <ButtonPrimitive label="Saving" loading onPress={() => {}} />
      <ButtonPrimitive label="Unavailable" disabled onPress={() => {}} />
    </View>
  ),
};

export const BottomSheet: Story = { render: () => <BottomSheetExample /> };
export const ChipGroup: Story = { render: () => <ChipGroupExample /> };
export const Combobox: Story = { render: () => <ComboboxExample /> };
export const Dialog: Story = { render: () => <DialogExample /> };
export const DirectionPicker: Story = { render: () => <DirectionPickerExample /> };
export const DataTable: Story = {
  render: () => (
    <DataTablePrimitive
      columns={[
        { key: 'team', label: 'Team' },
        { key: 'played', label: 'Played', align: 'right' },
        { key: 'points', label: 'Points', align: 'right' },
        { key: 'rank', label: 'Rank', align: 'right' },
      ]}
      rows={[
        { id: 1, team: 'Meeple United', played: 6, points: 18, rank: 1 },
        { id: 2, team: 'Cardboard Knights', played: 6, points: 15, rank: 2 },
        { id: 3, team: 'Dice & Glory', played: 6, points: 12, rank: 3 },
      ]}
    />
  ),
};
export const EmptyState: Story = { render: () => <EmptyStatePrimitive message="Nothing to show yet." /> };
export const FormField: Story = { render: () => <FormFieldExample /> };
export const InfoButton: Story = {
  render: () => <InfoButtonPrimitive title="Tie breakers" message="Tie breakers use strength of schedule." />,
};
export const Markdown: Story = {
  render: () => (
    <MarkdownPrimitive textStyle={typography.body}>
      {'## Tournament rules\n\n- Be kind\n- Play fair\n\nRead the **full rules** before round one.'}
    </MarkdownPrimitive>
  ),
};
export const PieChart: Story = {
  render: () => <PieChartPrimitive size={160} slices={[{ value: 5, color: '#d61f7a' }, { value: 3, color: '#12497d' }, { value: 2, color: '#4caf50' }]} />,
};
export const PlayerSelectionCard: Story = {
  render: () => (
    <AuthContext.Provider value={{ user: null, loading: false, login: async () => {}, loginWithPin: async () => {}, logout: async () => {}, isAdmin: false, isPinVerified: false }}>
      <PlayerSelectionCardPrimitive forceAllow onPress={() => {}} />
    </AuthContext.Provider>
  ),
};
export const ResizableTextInput: Story = { render: () => <ResizableTextInputExample /> };
export const SearchInput: Story = { render: () => <SearchInputExample /> };
export const SelectPicker: Story = { render: () => <SelectPickerExample /> };

const styles = StyleSheet.create({
  stack: { gap: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12 },
});
