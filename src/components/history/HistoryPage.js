import React from "react";
import FlowItem from "./FlowItem";
import Endpoint from "../api/endpoint";

import { Loader } from "cisco-ui-components";

class HistoryPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flownum: 0,
      flows: []
    };
  }

  componentDidMount() {
    this._isMounted = true;

    let response = Endpoint.api.tasks();
    response.then(res => {
      // Loop through tasks and add to state
      // console.log(res);
      let joined = this.state.flows;
      let counter = 0;
      for (const [key, value] of Object.entries(res.reply)) {
        if (value.token == null) {
          return;
        }

        // Change command to remove extra details
        let newcmd = value.cmd.split(" ");
        newcmd = newcmd.slice(5);
        newcmd = newcmd.join(" ");

        let newState = {
          token: value.token,
          status: value.status,
          cmd: newcmd,
          date: value.date,
          id: key
        };
        joined = joined.concat(newState);
        counter = counter + 1;
      }
      this.setState({
        flows: joined,
        flownum: counter
      });
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const flowItems = this.state.flows.map(item => (
      <FlowItem
        key={item.id}
        token={item.token}
        status={item.status}
        cmd={item.cmd}
        date={item.date}
      />
    ));

    const loader = (
      <div className="row">
        <div className="col-md-12 flex-center panel">
          <p>Ftriage tasks executed in the past will show up here.</p>
          <Loader type="spinner" color="indigo" />
        </div>
      </div>
    );

    return (
      <div>
        <div className="section">
          <h2>History</h2>
          <hr />
          {this.state.flownum > 0 ? flowItems : loader}
        </div>
      </div>
    );
  }
}

export default HistoryPage;
