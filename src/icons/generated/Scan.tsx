import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgScan = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M15 4.5a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0v-3h-3A.75.75 0 0 1 15 4.5M4.5 15a.75.75 0 0 1 .75.75v3h3a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75v-3.75A.75.75 0 0 1 4.5 15M19.5 15a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-.75.75h-3.75a.75.75 0 0 1 0-1.5h3v-3a.75.75 0 0 1 .75-.75M3.75 4.5a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5h-3v3a.75.75 0 0 1-1.5 0z"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgScan);
export default Memo;
