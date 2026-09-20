import { ChatDictationButton } from '@astryxdesign/core/Chat';
import { useMemo, useState, type ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatDictationButton>,
  'className' | 'dictation' | 'isHiddenWhenUnsupported' | 'label' | 'size'
>;

export interface AstryxChatDictationButtonProps extends RootProps {
  label?: string;
  size?: 'sm' | 'md';
  isDefaultListening?: boolean;
  className?: string;
}

export function AstryxChatDictationButton({
  label = 'Start dictation',
  size = 'md',
  isDefaultListening = false,
  className,
  ...rootProps
}: AstryxChatDictationButtonProps) {
  const [isListening, setIsListening] = useState(isDefaultListening);
  const dictation = useMemo(
    () => ({
      isSupported: true,
      isListening,
      isSpeaking: isListening,
      volume: isListening ? 0.12 : 0,
      bands: isListening ? [0.2, 0.55, 0.85, 0.48, 0.25] : [0, 0, 0, 0, 0],
      rawBands: isListening ? [0.1, 0.25, 0.4, 0.2, 0.1] : [0, 0, 0, 0, 0],
      interimTranscript: '',
      start: () => setIsListening(true),
      stop: () => setIsListening(false),
      abort: () => setIsListening(false),
      toggle: () => setIsListening((current) => !current),
    }),
    [isListening],
  );

  return (
    <ChatDictationButton
      {...rootProps}
      className={cx('astryx-wb-chat-dictation-button', className)}
      dictation={dictation}
      isHiddenWhenUnsupported={false}
      label={label || undefined}
      size={size}
    />
  );
}

AstryxChatDictationButton.displayName = 'AstryxChatDictationButton';
