import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgCheckCircle = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 32 32" {...props}>
		<Path
			fill="currentColor"
			d="M16 28c6.627 0 12-5.373 12-12S22.627 4 16 4 4 9.373 4 16s5.373 12 12 12"
			opacity={0.2}
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M22.223 12.31a1 1 0 0 1-.032 1.413l-7.334 7a1 1 0 0 1-1.38 0l-3.667-3.5a1 1 0 0 1 1.38-1.446l2.977 2.84 6.643-6.34a1 1 0 0 1 1.413.033"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M16 5C9.925 5 5 9.925 5 16s4.925 11 11 11 11-4.925 11-11S22.075 5 16 5M3 16C3 8.82 8.82 3 16 3s13 5.82 13 13-5.82 13-13 13S3 23.18 3 16"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgCheckCircle);
export default Memo;
