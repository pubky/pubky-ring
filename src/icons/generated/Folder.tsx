import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgFolder = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 16 16" {...props}>
		<Path
			fill="currentColor"
			d="M6.146 3.146 8 5H2V3.5a.5.5 0 0 1 .5-.5h3.293a.5.5 0 0 1 .353.146"
			opacity={0.2}
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M1.5 5a.5.5 0 0 1 .5-.5h11.5a1 1 0 0 1 1 1v7.056a.945.945 0 0 1-.944.944H2.46a.963.963 0 0 1-.96-.96V5m12 7.5h-11v-7h11z"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M1.793 2.793A1 1 0 0 1 2.5 2.5h3.293a1 1 0 0 1 .707.293l1.854 1.853a.5.5 0 1 1-.708.708L5.793 3.5H2.5V5a.5.5 0 0 1-1 0V3.5a1 1 0 0 1 .293-.707"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgFolder);
export default Memo;
