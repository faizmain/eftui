import { Sidebar } from "cisco-ui-components";
import React from "react";
import { NavLink } from "react-router-dom";

class SideMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = { visible: true };
  }

  componentDidMount() {
    console.log("Search for sites");
  }

  render() {
    const activeStyle = { color: "tertiary" };
    return (
      <Sidebar
        title="Ftriage"
        visible={this.state.visible}
        activeItem="item1"
        color="secondary"
      >
        <div>
          <NavLink
            className="header-item"
            to="/"
            activeStyle={activeStyle}
            exact
          >
            Home
          </NavLink>
        </div>
        <div>
          <NavLink
            className="header-item"
            to="/history"
            activeStyle={activeStyle}
            exact
          >
            History
          </NavLink>
        </div>

        <div>
          <NavLink
            className="header-item"
            to="/sites"
            activeStyle={activeStyle}
            exact
          >
            Sites
          </NavLink>
        </div>

        <div>
          <NavLink
            className="header-item"
            to="/help"
            activeStyle={activeStyle}
            exact
          >
            Help
          </NavLink>
        </div>
      </Sidebar>
    );
  }
}

export default SideMenu;
