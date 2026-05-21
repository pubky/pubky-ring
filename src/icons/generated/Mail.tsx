import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgMail = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			stroke="#89898F"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7m2-3h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2"
		/>
	</Svg>
);
const Memo = memo(SvgMail);
export default Memo;
