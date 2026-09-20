import {
  useRef,
  type ComponentPropsWithoutRef,
} from 'react';
import { AstryxIcon } from './AstryxIcon';
import { cx } from './classNames';
import { useAstryxPowerSearchSurface } from './AstryxPowerSearch';

type InputRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxPowerSearchInputProps extends InputRootProps {
  label?: string;
  placeholder?: string;
  resultCount?: string;
  hasClear?: boolean;
  isLabelHidden?: boolean;
  className?: string;
}

export function AstryxPowerSearchInput({
  label = 'Search projects',
  placeholder = 'Filter by title, status, date, or owner',
  resultCount = '24 results',
  hasClear = true,
  isLabelHidden = false,
  className,
  ...rootProps
}: AstryxPowerSearchInputProps) {
  const surface = useAstryxPowerSearchSurface();
  const shouldToggleMenuRef = useRef(false);
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-power-search-input', className)}
      data-astryx-wb-power-search-input="true"
    >
      {!isLabelHidden && <label>{label}</label>}
      <div className="astryx-wb-power-search-input__control">
        <AstryxIcon icon="search" size="sm" />
        <input
          aria-expanded={surface?.isMenuOpen ?? false}
          aria-label={label}
          disabled={!surface || surface.isDisabled}
          onChange={(event) => surface?.setQuery(event.currentTarget.value)}
          onClick={() => {
            if (!surface) return;
            if (shouldToggleMenuRef.current) {
              surface.toggleMenu();
            } else {
              surface.openMenu();
            }
            shouldToggleMenuRef.current = false;
          }}
          onFocus={() => surface?.openMenu()}
          onPointerDown={(event) => {
            shouldToggleMenuRef.current =
              event.currentTarget.ownerDocument.activeElement === event.currentTarget &&
              Boolean(surface?.isMenuOpen);
          }}
          placeholder={placeholder}
          value={surface?.query ?? ''}
        />
        {resultCount && <span>{resultCount}</span>}
        {hasClear && surface?.query && (
          <button
            aria-label="Clear search"
            onClick={() => surface.setQuery('')}
            type="button"
          >
            <AstryxIcon icon="close" size="sm" />
          </button>
        )}
      </div>
      {surface && surface.filters.length > 0 && (
        <div className="astryx-wb-power-search-input__tokens">
          {surface.filters.map((filter, index) => {
            const field = surface.config.fields.find((candidate) => candidate.key === filter.field);
            return (
              <span key={`${filter.field}-${index}`}>
                {field?.label || filter.field}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

AstryxPowerSearchInput.displayName = 'AstryxPowerSearchInput';
