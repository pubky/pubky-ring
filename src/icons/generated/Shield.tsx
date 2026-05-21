import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgShield = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			d="M3.75 10V4.5a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 .75.75V10c0 7.876-6.685 10.486-8.02 10.929a.7.7 0 0 1-.46 0C10.435 20.486 3.75 17.876 3.75 10"
			opacity={0.2}
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M3.44 3.44A1.5 1.5 0 0 1 4.5 3h15A1.5 1.5 0 0 1 21 4.5V10c0 8.405-7.147 11.18-8.53 11.64a1.46 1.46 0 0 1-.94 0C10.147 21.18 3 18.404 3 10V4.5c0-.398.158-.78.44-1.06M19.5 4.5h-15V10c0 7.33 6.193 9.78 7.5 10.215 1.307-.435 7.5-2.885 7.5-10.215z"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgShield);
export default Memo;
