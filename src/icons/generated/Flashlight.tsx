import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgFlashlight = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			d="M18 7.25a.75.75 0 0 1-.15.45l-1.95 2.6a.75.75 0 0 0-.15.45V21a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75V10.75a.75.75 0 0 0-.15-.45L6.15 7.7A.75.75 0 0 1 6 7.25V6h12z"
			opacity={0.2}
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M5.69 1.94a1.5 1.5 0 0 1 1.06-.44h10.5a1.5 1.5 0 0 1 1.5 1.5v4.25a1.5 1.5 0 0 1-.3.9l-1.95 2.6V21a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 21V10.75l-1.95-2.6a1.5 1.5 0 0 1-.3-.9V3c0-.398.158-.78.44-1.06M6.75 3v4.25l1.95 2.6c.195.26.3.575.3.9V21h6V10.75c0-.325.105-.64.3-.9l1.95-2.6V3z"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M12 10.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75M5.25 6A.75.75 0 0 1 6 5.25h12a.75.75 0 0 1 0 1.5H6A.75.75 0 0 1 5.25 6"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgFlashlight);
export default Memo;
