import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgTablet = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 6" {...props}>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M18.75 4.5a.75.75 0 0 0-.75-.75H6a.75.75 0 0 0-.75.75v15c0 .414.336.75.75.75h12a.75.75 0 0 0 .75-.75zM18 2.25a2.25 2.25 0 0 1 2.25 2.25v15A2.25 2.25 0 0 1 18 21.75H6a2.25 2.25 0 0 1-2.25-2.25v-15A2.25 2.25 0 0 1 6 2.25z"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M3.75 6a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15A.75.75 0 0 1 3.75 6"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgTablet);
export default Memo;
