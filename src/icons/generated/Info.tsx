import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgInfo = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path fill="currentColor" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18" opacity={0.2} />
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M12 3.75a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12"
			clipRule="evenodd"
		/>
		<Path fill="currentColor" d="M12 9a1.125 1.125 0 1 0 0-2.25A1.125 1.125 0 0 0 12 9" />
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M10.5 11.25a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1 0 1.5H12a.75.75 0 0 1-.75-.75V12a.75.75 0 0 1-.75-.75"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgInfo);
export default Memo;
