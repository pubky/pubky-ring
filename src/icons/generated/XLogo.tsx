import * as React from 'react';
import Svg, { G, Path, Defs, ClipPath } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgXLogo = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<G clipPath="url(#a)">
			<Path
				fill="#89898F"
				d="M14.283 10.162 23.218-.001H21.1l-7.758 8.824L7.147 0H0l9.37 13.343L0 24h2.117l8.193-9.318 6.543 9.318H24zm-2.9 3.298-.95-1.329L2.88 1.56h3.252l6.096 8.532.95 1.329 7.924 11.09h-3.253z"
				opacity={0.8}
			/>
		</G>
		<Defs>
			<ClipPath id="a">
				<Path fill="currentColor" d="M0 0h24v24H0z" />
			</ClipPath>
		</Defs>
	</Svg>
);
const Memo = memo(SvgXLogo);
export default Memo;
