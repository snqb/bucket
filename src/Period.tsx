import { ShortTask } from "./Task";
import {
	Box,
	Grid,
	HStack,
	Heading,
	StackDivider,
	VStack,
} from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import Adder from "./Adder";
import { PERIODS, PERIOD_TEXTS } from "./constants";
import { TodoState, horizontalIndex, useAppSelector } from "./store";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";
import { useEffect, useState } from "react";
import { EffectCube } from "swiper/modules";

interface Props {
	periods: readonly (keyof TodoState)[];
	row: number;
}

const Period = ({ periods, row }: Props) => {
	const tasks = useAppSelector((state) => state.todo);
	const [controller, setController] = useState<SwiperClass>();

	const [autoAnimate] = useAutoAnimate({ duration: 250, easing: "linear" });

	useEffect(() => {
		const timerId = requestAnimationFrame(() =>
			controller?.slideTo(horizontalIndex.value, 0),
		);

		return () => cancelAnimationFrame(timerId);
	}, [horizontalIndex.value]);

	return (
		<Swiper
			slidesPerView={1}
			loop
			onSlideChange={(it) => {
				horizontalIndex.value = it.activeIndex;
			}}
			onSwiper={setController}
			direction="horizontal"
		>
			{periods.map((period, index) => (
				<SwiperSlide key={period} style={{ width: "100vw", height: "100vh" }}>
					<VStack
						spacing={2}
						id="later"
						align="stretch"
						divider={
							<StackDivider borderStyle="dotted" borderColor="gray.800" />
						}
						ref={autoAnimate as any}
						maxHeight="77vh"
					>
						<HStack>
							<Grid
								w="22px"
								h="22px"
								templateColumns="repeat(3, 1fr)"
								gap={0.5}
							>
								{PERIODS.map((it, current) => (
									<Box
										key={it}
										borderRadius="50%"
										bg={current === row * 3 + index ? "white" : "gray.500"}
									/>
								))}
							</Grid>
							<Heading>{PERIOD_TEXTS[period]}</Heading>
						</HStack>

						<Adder placeholder="faster things..." where={period} />

						{tasks[period].map((task, index) => (
							<ShortTask key={task.id} task={task} where={period} />
						))}
					</VStack>
				</SwiperSlide>
			))}
		</Swiper>
	);
};

export default Period;
