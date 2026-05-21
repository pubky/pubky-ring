import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgChevronLeft = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			fillOpacity={0.64}
			fillRule="evenodd"
			d="M15.53 19.28a.75.75 0 0 1-1.06 0l-6.75-6.75a.75.75 0 0 1 0-1.06l6.75-6.75a.75.75 0 1 1 1.06 1.06L9.31 12l6.22 6.22a.75.75 0 0 1 0 1.06"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgChevronLeft);
export default Memo;
