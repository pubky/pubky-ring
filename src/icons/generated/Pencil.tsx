import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgPencil = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			d="M12.75 6 18 11.25l2.47-2.47a.75.75 0 0 0 0-1.06l-4.19-4.19a.75.75 0 0 0-1.06 0z"
			opacity={0.2}
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M3.267 14.517a.75.75 0 0 1 1.06 0l5.155 5.155a.75.75 0 1 1-1.06 1.06l-5.155-5.154a.75.75 0 0 1 0-1.06"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M14.69 3a1.5 1.5 0 0 1 2.12 0l-.5.501.5-.501L21 7.19a1.5 1.5 0 0 1 0 2.12L9.75 20.56a1.5 1.5 0 0 1-1.06.44H4.5A1.5 1.5 0 0 1 3 19.5v-4.19a1.5 1.5 0 0 1 .44-1.06zm5.25 5.25-4.19-4.19L4.5 15.31l-.53-.53.53.53v4.19h4.19z"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M12.22 5.47a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgPencil);
export default Memo;
