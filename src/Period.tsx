import { ShortTask } from "./Task";
import { Heading, StackDivider, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import Adder from "./Adder";
import { PERIOD_TEXTS } from "./constants";
import { TodoState, useAppSelector } from "./newStore";
import { Swiper, SwiperSlide } from "swiper/react";

const Period = ({ periods }: { periods: readonly (keyof TodoState)[] }) => {
	const tasks = useAppSelector((state) => state.todo);

	const [autoAnimate] = useAutoAnimate({ duration: 250, easing: "linear" });

	return (
		<Swiper slidesPerView={1} loop direction="horizontal">
			{periods.map((period) => (
				<SwiperSlide key={period} style={{ width: "100vw", height: "100vh" }}>
					<VStack
						spacing={2}
						id="later"
						align="stretch"
						divider={<StackDivider borderColor="gray.800" />}
						ref={autoAnimate as any}
						maxHeight="77vh"
					>
						<Heading>{PERIOD_TEXTS[period]}</Heading>

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
