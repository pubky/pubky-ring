import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgMonitor = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			d="M4.5 18h15a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5h-15A1.5 1.5 0 0 0 3 6v10.5A1.5 1.5 0 0 0 4.5 18"
			opacity={0.2}
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M19.5 17.25a.75.75 0 0 0 .75-.75V6a.75.75 0 0 0-.75-.75h-15a.75.75 0 0 0-.75.75v10.5c0 .414.336.75.75.75zm2.25-.75a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6A2.25 2.25 0 0 1 4.5 3.75h15A2.25 2.25 0 0 1 21.75 6zM8.25 21a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgMonitor);
export default Memo;
