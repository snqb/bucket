import { List } from "@chakra-ui/react";
import { useTasks } from "../data/useTasks";
import Task from "../Task";
import { CSSTransition, TransitionGroup } from "react-transition-group";

const Today = () => {
  const { today } = useTasks();

  return (
    <div>
      <List spacing={2}>
        <TransitionGroup>
          {today.map((task) => (
            <CSSTransition key={task.id} timeout={1000}>
              <Task task={task} />
            </CSSTransition>
          ))}
        </TransitionGroup>
      </List>
    </div>
  );
};

export default Today;
