import { FileInput } from '@astryxdesign/core/FileInput';
import { useState, type ComponentPropsWithoutRef } from 'react';
import { resolveAstryxFieldRootProps } from './AstryxFieldRoot';
import { cx } from './classNames';

export type AstryxFileInputMode = 'dropzone' | 'input';
export type AstryxFileInputStatus = 'none' | 'success' | 'warning' | 'error';

type AstryxFileInputRootProps = Omit<
  ComponentPropsWithoutRef<typeof FileInput>,
  | 'accept'
  | 'className'
  | 'description'
  | 'isDisabled'
  | 'isLabelHidden'
  | 'isLoading'
  | 'isMultiple'
  | 'isOptional'
  | 'isRequired'
  | 'label'
  | 'labelTooltip'
  | 'maxFiles'
  | 'maxSize'
  | 'mode'
  | 'onChange'
  | 'placeholder'
  | 'status'
  | 'value'
  | 'width'
>;

export interface AstryxFileInputProps extends AstryxFileInputRootProps {
  label?: string;
  description?: string;
  placeholder?: string;
  accept?: string;
  mode?: AstryxFileInputMode;
  status?: AstryxFileInputStatus;
  statusMessage?: string;
  width?: string;
  maxSize?: number;
  maxFiles?: number;
  isMultiple?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  isRequired?: boolean;
  isOptional?: boolean;
  isLabelHidden?: boolean;
  labelTooltip?: string;
  className?: string;
}

export function AstryxFileInput({
  label = 'Project asset',
  description = 'Upload a source image, icon, or document.',
  placeholder = 'Choose file',
  accept = 'image/*,.pdf',
  mode = 'input',
  status = 'none',
  statusMessage = '',
  width = '360px',
  maxSize,
  maxFiles,
  isMultiple = false,
  isDisabled = false,
  isLoading = false,
  isRequired = false,
  isOptional = false,
  isLabelHidden = false,
  labelTooltip = '',
  className,
  ...rootProps
}: AstryxFileInputProps) {
  const [value, setValue] = useState<File | File[] | null>(null);
  const rootWidth = resolveAstryxFieldWidth(width);
  const { rootDomProps, rootStyle } = resolveAstryxFieldRootProps(rootProps, rootWidth);

  return (
    <div
      {...rootDomProps}
      className={cx('astryx-wb-field-root', className)}
      style={rootStyle}
    >
      <FileInput
        accept={accept}
        className="astryx-wb-file-input"
        description={description || undefined}
        isDisabled={isDisabled}
        isLabelHidden={isLabelHidden}
        isLoading={isLoading}
        isMultiple={isMultiple}
        isOptional={isOptional}
        isRequired={isRequired}
        label={label}
        labelTooltip={labelTooltip || undefined}
        maxFiles={maxFiles}
        maxSize={maxSize}
        mode={mode}
        onChange={setValue}
        placeholder={placeholder}
        status={resolveInputStatus(status, statusMessage)}
        value={value}
        width="100%"
      />
    </div>
  );
}

function resolveInputStatus(status: AstryxFileInputStatus, message: string) {
  return status === 'none' ? undefined : { type: status, message: message || `${status} status` };
}

function resolveAstryxFieldWidth(width: string): string {
  if (width === 'inherit') return '';
  if (width === 'full') return '100%';
  if (width === 'sm') return '280px';
  if (width === 'md') return '360px';
  if (width === 'lg') return '520px';
  return width;
}
