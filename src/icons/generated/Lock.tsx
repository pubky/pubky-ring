import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgLock = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			d="M19.5 8.25h-15a.75.75 0 0 0-.75.75v10.5c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75V9a.75.75 0 0 0-.75-.75"
			opacity={0.2}
		/>
		<Path fill="currentColor" d="M12 15.375a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25" />
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M3 9a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 9v10.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5zm16.5 0h-15v10.5h15z"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M12 2.25a2.625 2.625 0 0 0-2.625 2.625V8.25a.75.75 0 0 1-1.5 0V4.875a4.125 4.125 0 0 1 8.25 0V8.25a.75.75 0 0 1-1.5 0V4.875A2.625 2.625 0 0 0 12 2.25"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgLock);
export default Memo;
