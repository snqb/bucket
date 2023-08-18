import { Flex } from "@chakra-ui/react";

import ReloadPrompt from "./ReloadPrompt";
import { useEffect, useState } from "react";

import Period from "./Period";
import { persistor, store } from "./newStore";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Swiper, SwiperSlide } from "swiper/react";

function App() {
	return (
		<Provider store={store}>
			<PersistGate persistor={persistor}>
				<Flex px={[5, 5, 10, 20, 300]} pt={10} maxW="500px" overflowY="hidden">
					<Swiper
						style={{
							height: "100vh",
							width: "100%",
						}}
						direction="vertical"
						slidesPerView={1}
					>
						<SwiperSlide>
							<Period periods={["today", "tomorrow", "someday"] as const} />
						</SwiperSlide>
						<SwiperSlide>
							<Period periods={["thisWeek", "nextWeek", "someWeek"] as const} />
						</SwiperSlide>
					</Swiper>

					<ReloadPrompt />
				</Flex>
			</PersistGate>
		</Provider>
	);
}

export default App;

const usePersistedTab = () => {
	const tabState = useState(Number(localStorage.getItem("current-tab")) ?? 0);

	const [tab, setTab] = tabState;

	useEffect(() => {
		localStorage.setItem("current-tab", tab.toString());
	}, [tab]);

	return tabState;
};
