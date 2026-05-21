import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgPlus = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M12 3a.75.75 0 0 1 .75.75v16.5a.75.75 0 0 1-1.5 0V3.75A.75.75 0 0 1 12 3"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgPlus);
export default Memo;
