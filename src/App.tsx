import {
  Box,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import Bucket from "./Bucket";

import "@fontsource/lato";
import Shuffle from "./Shuffle";
import { ITask, useTasks } from "./data/useTasks";
import ReloadPrompt from "./ReloadPrompt";

function App() {
  const { bucket } = useTasks();

  const hasEnoughTasksForShuffle = (bucket as ITask[]).length > 4;

  return (
    <Flex px={[1, 5, 10, 20, 300]} py={[1, 1, 1, 1, 1, 10]} direction="column">
      <Tabs
        defaultIndex={0}
        align="end"
        boxSizing="content-box"
        variant="unstyled"
      >
        <TabList minH={50} _hover={{ cursor: "pointer" }}>
          <HeadingTab>🪣 Bucket</HeadingTab>
          {/* {hasEnoughTasksForShuffle && <HeadingTab>🔀 Shuffle</HeadingTab>} */}
        </TabList>
        <TabPanels>
          <TabPanel>
            <Bucket />
          </TabPanel>
          <TabPanel>
            <Shuffle />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <ReloadPrompt />
    </Flex>
  );
}

export default App;

const HeadingTab = (props: any) => {
  return (
    <Tab
      as={Heading}
      fontSize="lg"
      color="gray.200"
      _focusVisible={false}
      _selected={{
        fontSize: ["3xl", "5xl"],
      }}
      _hover={{ color: "pink.400" }}
      {...props}
    />
  );
};

function SwipablePanel(props: any) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const initial = {
  state: {
    tasks: {
      "pP-m5cElXavi_Vf6lYVlD": {
        id: "pP-m5cElXavi_Vf6lYVlD",
        title: {
          text: "first",
          emoji: "🌓",
        },
        createdAt: "2022-12-01T00:24:24.840Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      "lHjTLfrC-PaAM2-F8eCEv": {
        id: "lHjTLfrC-PaAM2-F8eCEv",
        title: {
          text: "second",
          emoji: "⭕",
        },
        createdAt: "2022-12-01T00:24:25.847Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      hEYGW42dZcZAkawNfKVv7: {
        id: "hEYGW42dZcZAkawNfKVv7",
        title: {
          text: "third",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:24:26.504Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      "42VAqVW7O1HE4dUsD_IJO": {
        id: "42VAqVW7O1HE4dUsD_IJO",
        title: {
          text: "haha",
          emoji: "😂",
        },
        createdAt: "2022-12-01T00:24:27.243Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      "5y2LLzjQ9qLoPFuaWHGtk": {
        id: "5y2LLzjQ9qLoPFuaWHGtk",
        title: {
          text: "asdasd",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:32:42.691Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      "0JJmlZgzzd3AkHDJEhpgf": {
        id: "0JJmlZgzzd3AkHDJEhpgf",
        title: {
          text: "asd",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:33:51.477Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      "YUSQ70a55-9eca3V46309": {
        id: "YUSQ70a55-9eca3V46309",
        title: {
          text: "asdsa",
          emoji: "🈂️",
        },
        createdAt: "2022-12-01T00:33:51.793Z",
        progress: 74.79,
        wasSentTo: "graveyard",
      },
      "FYQS4HE9O58i-qYdrC290": {
        id: "FYQS4HE9O58i-qYdrC290",
        title: {
          text: "qwe",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:33:52.094Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      HrgmfQzL9VY8lCooZzcGf: {
        id: "HrgmfQzL9VY8lCooZzcGf",
        title: {
          text: "qw",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:33:52.259Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      "3tfUDk_3HhrkSO-oGSBu_": {
        id: "3tfUDk_3HhrkSO-oGSBu_",
        title: {
          text: "eq",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:33:52.441Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      "3RqrPwmcA-Fhmuuv5nJHz": {
        id: "3RqrPwmcA-Fhmuuv5nJHz",
        title: {
          text: "weqw",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:33:52.624Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      KCu767ye6xRbHKzUvf3gB: {
        id: "KCu767ye6xRbHKzUvf3gB",
        title: {
          text: "e",
          emoji: "💯",
        },
        createdAt: "2022-12-01T00:33:52.779Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      slaVPhXASrBBbw6FIzlb3: {
        id: "slaVPhXASrBBbw6FIzlb3",
        title: {
          text: "asdasd",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:35:30.548Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      y3uJUQMAk6zulSoQRdKJs: {
        id: "y3uJUQMAk6zulSoQRdKJs",
        title: {
          text: "qwe",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:35:32.328Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      Itb6ZMpPpi_8kRfYPANqG: {
        id: "Itb6ZMpPpi_8kRfYPANqG",
        title: {
          text: "qweqe",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:35:33.310Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      lOyoybsQdolRpShwoWGFO: {
        id: "lOyoybsQdolRpShwoWGFO",
        title: {
          text: "asdasdas",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:42:21.684Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      vQ7iQZMumeiY7t8f_G5eR: {
        id: "vQ7iQZMumeiY7t8f_G5eR",
        title: {
          text: "qweqwe",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:42:22.429Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      "5UsZSWL7n9MqzJaCYb-tY": {
        id: "5UsZSWL7n9MqzJaCYb-tY",
        title: {
          text: "asdasd",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:42:22.961Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      CwAx3T7AFkic9yl81Vctm: {
        id: "CwAx3T7AFkic9yl81Vctm",
        title: {
          text: "first",
          emoji: "🌓",
        },
        createdAt: "2022-12-01T00:42:25.807Z",
        progress: 100,
        wasSentTo: "graveyard",
        description: "",
      },
      "4OkXN7sbPZiODizvL5b5r": {
        id: "4OkXN7sbPZiODizvL5b5r",
        title: {
          text: "two",
          emoji: "2️⃣",
        },
        createdAt: "2022-12-01T00:42:26.755Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      asG8A6wBHjSpWIRNKpmvR: {
        id: "asG8A6wBHjSpWIRNKpmvR",
        title: {
          text: "dor",
          emoji: "👓",
        },
        createdAt: "2022-12-01T00:42:28.445Z",
        progress: 98.26,
        wasSentTo: "graveyard",
      },
      LfiAxbQU2RIm9wn5EA7ED: {
        id: "LfiAxbQU2RIm9wn5EA7ED",
        title: {
          text: "sdjk",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:42:29.413Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      "S-5BI93YX7XMWWV3_0m6b": {
        id: "S-5BI93YX7XMWWV3_0m6b",
        title: {
          text: "great",
          emoji: "🅰️",
        },
        createdAt: "2022-12-01T00:42:30.328Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      "7XfvRdl3u43r_3R1gqUxC": {
        id: "7XfvRdl3u43r_3R1gqUxC",
        title: {
          text: "bring",
          emoji: "💍",
        },
        createdAt: "2022-12-01T00:42:31.729Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      xXRBJBruxrkyrxmQY_D2D: {
        id: "xXRBJBruxrkyrxmQY_D2D",
        title: {
          text: "me",
          emoji: "😏",
        },
        createdAt: "2022-12-01T00:42:32.214Z",
        progress: 62.33,
        wasSentTo: "bucket",
      },
      KgQ30nVzEod1efT5Q41HN: {
        id: "KgQ30nVzEod1efT5Q41HN",
        title: {
          text: "to",
          emoji: "😋",
        },
        createdAt: "2022-12-01T00:42:32.822Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      HeKZCU6XrEhkuzcupYpns: {
        id: "HeKZCU6XrEhkuzcupYpns",
        title: {
          text: "life",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:42:33.298Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      iaYhrA96UNazpEzDpjfW3: {
        id: "iaYhrA96UNazpEzDpjfW3",
        title: {
          text: "sea ",
          emoji: "🐋",
        },
        createdAt: "2022-12-02T20:25:21.980Z",
        progress: 100,
        wasSentTo: "graveyard",
      },
      PVOtAZD7Y37W6qBu3wPKm: {
        id: "PVOtAZD7Y37W6qBu3wPKm",
        title: {
          text: "go to seaside",
          emoji: "🐋",
        },
        createdAt: "2022-12-02T20:34:52.513Z",
        progress: 57.29,
        wasSentTo: "bucket",
      },
      fvwo4hwm3OGFzcjee_k9h: {
        id: "fvwo4hwm3OGFzcjee_k9h",
        title: {
          text: "see some people",
          emoji: "👪",
        },
        createdAt: "2022-12-02T20:34:55.982Z",
        progress: 6.29,
        wasSentTo: "bucket",
      },
      "1DRk1JT8DQn1IGxCHggG4": {
        id: "1DRk1JT8DQn1IGxCHggG4",
        title: {
          text: "drinking game",
          emoji: "🍵",
        },
        createdAt: "2022-12-02T20:35:02.428Z",
        progress: 70.45,
        wasSentTo: "bucket",
      },
      Jnm6Eegn5jagtxT7CDx2W: {
        id: "Jnm6Eegn5jagtxT7CDx2W",
        title: {
          text: "teach myself biology",
          emoji: "⭕",
        },
        createdAt: "2022-12-02T20:35:12.009Z",
        progress: 1,
        wasSentTo: "bucket",
      },
      aRuZGi9KpuELvlnTk4s4c: {
        id: "aRuZGi9KpuELvlnTk4s4c",
        title: {
          text: "watch that later show",
          emoji: "🎓",
        },
        createdAt: "2022-12-02T20:35:19.020Z",
        progress: 24.64,
        wasSentTo: "bucket",
      },
      "ab0M5ENoLceET-jCX_GIt": {
        id: "ab0M5ENoLceET-jCX_GIt",
        title: {
          text: "great expectations read",
          emoji: "❎",
        },
        createdAt: "2022-12-02T20:35:23.345Z",
        progress: 34.55,
        wasSentTo: "bucket",
      },
    },
    shuffle: [
      {
        id: "LfiAxbQU2RIm9wn5EA7ED",
        title: {
          text: "sdjk",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:42:29.413Z",
        progress: 100,
        wasSentTo: "bucket",
      },
      {
        id: "iaYhrA96UNazpEzDpjfW3",
        title: {
          text: "sea ",
          emoji: "🐋",
        },
        createdAt: "2022-12-02T20:25:21.980Z",
        progress: 100,
        wasSentTo: "bucket",
      },
      {
        id: "y3uJUQMAk6zulSoQRdKJs",
        title: {
          text: "qwe",
          emoji: "📝",
        },
        createdAt: "2022-12-01T00:35:32.328Z",
        progress: 1,
        wasSentTo: "bucket",
      },
    ],
  },
  version: 2,
};
