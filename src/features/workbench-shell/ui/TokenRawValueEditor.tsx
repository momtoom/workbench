import { SelectControl } from '@shared/ui/primitives';
import type {
  AngleUnit,
  DesignToken,
  DimensionUnit,
  DurationUnit,
  TokenRawLiteral,
  TokenRegistry,
} from '@domain/design-system/tokens/types';
import {
  isAngleValue,
  isDimensionValue,
  isDurationValue,
  isGradientValue,
  isOpacityValue,
} from '@domain/design-system/tokens/types';
import { defaultGradientValue, gradientPreviewCss, gradientToCss } from '@domain/design-system/tokens/gradient';
import { InlineEditInput } from './InlineEditControls';
import { NumberScrubHandle } from './NumberScrubHandle';
import { EditableColorSwatch } from './TokenVisuals';

type RawTokenValueEditorProps = {
  token: DesignToken;
  value: TokenRawLiteral;
  registry: TokenRegistry;
  openGradient: () => void;
  update: (value: TokenRawLiteral) => void;
};

export function RawTokenValueEditor({
  token,
  value,
  registry,
  openGradient,
  update,
}: RawTokenValueEditorProps) {
  if (token.type === 'color') {
    const color = typeof value === 'string' ? value : '#000000';
    return (
      <div className="wb-color-editor">
        <EditableColorSwatch
          label={`${token.name} color swatch`}
          value={isHexColor(color) ? color : '#000000'}
          onChange={(next) => update(next)}
        />
        <InlineEditInput
          ariaLabel={`${token.name} color value`}
          autoFocus
          value={color}
          onChange={update}
        />
      </div>
    );
  }

  if (token.type === 'number') {
    const numberValue = typeof value === 'number' ? value : 0;
    return (
      <NumberValueEditor
        ariaLabel={`${token.name} number value`}
        value={numberValue}
        onChange={(next) => update(next)}
      />
    );
  }

  if (token.type === 'dimension') {
    const dimension = isDimensionValue(value) ? value : { value: 1, unit: 'rem' as DimensionUnit };
    return (
      <UnitValueEditor
        value={dimension.value}
        unit={dimension.unit}
        units={['px', 'rem', 'em', '%', 'vh', 'vw']}
        onChange={(next) => update(next)}
      />
    );
  }

  if (token.type === 'duration') {
    const duration = isDurationValue(value) ? value : { value: 120, unit: 'ms' as DurationUnit };
    return (
      <UnitValueEditor
        value={duration.value}
        unit={duration.unit}
        units={['ms', 's']}
        min={0}
        onChange={(next) => update(next)}
      />
    );
  }

  if (token.type === 'angle') {
    const angle = isAngleValue(value) ? value : { value: 0, unit: 'deg' as AngleUnit };
    return (
      <UnitValueEditor
        value={angle.value}
        unit={angle.unit}
        units={['deg', 'rad', 'turn']}
        onChange={(next) => update(next)}
      />
    );
  }

  if (token.type === 'opacity') {
    const opacity = isOpacityValue(value) ? value : { value: 100, unit: '%' as const };
    return (
      <UnitValueEditor
        value={opacity.value}
        unit={opacity.unit}
        units={['%', 'number']}
        min={0}
        max={opacity.unit === '%' ? 100 : 1}
        step={opacity.unit === '%' ? 1 : 0.01}
        onChange={(next) => update(next)}
      />
    );
  }

  if (token.type === 'boolean') {
    return <button type="button" className={value ? 'wb-toggle wb-toggle--on' : 'wb-toggle'} onClick={() => update(!value)}><span /></button>;
  }

  if (token.type === 'gradient') {
    const gradientCss = gradientPreviewCss(value, registry);
    if (isGradientValue(value)) {
      return (
        <button type="button" className="wb-gradient-trigger" style={{ background: gradientCss ?? gradientToCss(value, registry) }} onClick={openGradient}>
          Edit gradient
        </button>
      );
    }
    return (
      <div className="wb-gradient-raw-editor">
        <span className="wb-gradient-trigger wb-gradient-trigger--preview" style={{ background: gradientCss ?? gradientToCss(defaultGradientValue(), registry) }} />
        <InlineEditInput
          ariaLabel={`${token.name} gradient value`}
          autoFocus
          value={typeof value === 'string' ? value : ''}
          onChange={update}
        />
      </div>
    );
  }

  return <InlineEditInput autoFocus value={typeof value === 'string' ? value : ''} onChange={update} />;
}

function UnitValueEditor<Unit extends string>({
  max,
  min,
  onChange,
  step,
  unit,
  units,
  value,
}: {
  max?: number;
  min?: number;
  onChange: (value: { value: number; unit: Unit }) => void;
  step?: number;
  unit: Unit;
  units: Unit[];
  value: number;
}) {
  const scrubStep = getScrubStepForUnit(unit, step);
  return (
    <div className="wb-unit-value-editor">
      <div className="wb-token-number-field">
        <NumberScrubHandle label="Adjust token value" min={min} max={max} scrubStep={scrubStep} value={Number.isFinite(value) ? value : 0} onChange={(nextValue) => onChange({ value: nextValue, unit })}>Value</NumberScrubHandle>
        <InlineEditInput
          type="number"
          autoFocus
          max={max}
          min={min}
          step={step ?? 'any'}
          value={Number.isFinite(value) ? value : 0}
          onChange={(next) => onChange({ value: Number(next), unit })}
        />
      </div>
      <SelectControl<Unit>
        aria-label="Token unit"
        value={unit}
        onValueChange={(nextUnit) => onChange({ value, unit: nextUnit })}
      >
        {units.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
      </SelectControl>
    </div>
  );
}

function NumberValueEditor({
  ariaLabel,
  max,
  min,
  onChange,
  scrubStep = 1,
  value,
}: {
  ariaLabel: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  scrubStep?: number;
  value: number;
}) {
  return (
    <div className="wb-number-value-editor">
      <div className="wb-token-number-field">
        <NumberScrubHandle label={`Adjust ${ariaLabel}`} min={min} max={max} scrubStep={scrubStep} value={value} onChange={onChange}>Value</NumberScrubHandle>
        <InlineEditInput
          ariaLabel={ariaLabel}
          type="number"
          autoFocus
          max={max}
          min={min}
          step={scrubStep}
          value={Number.isFinite(value) ? value : 0}
          onChange={(next) => onChange(Number(next))}
        />
      </div>
    </div>
  );
}

function getScrubStepForUnit(unit: string, explicitStep?: number): number {
  if (explicitStep) return explicitStep;
  if (unit === 'number' || unit === 'turn') return 0.01;
  if (unit === 'rem' || unit === 'em' || unit === 's' || unit === 'rad') return 0.05;
  return 1;
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}
