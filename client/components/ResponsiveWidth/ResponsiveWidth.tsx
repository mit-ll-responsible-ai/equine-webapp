// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from "react"

type State = {
  width: number
}

export const DEFAULT_WIDTH = 500 //important for testing

export const withResponsiveWidth = (
  Component: React.ComponentType<any> | React.FC<any>,
) => class WithResponsiveWidth extends React.Component<any, State> {
  timeout: number = -1
  widthRef: React.RefObject<HTMLDivElement> = React.createRef()

  state = {
    width: DEFAULT_WIDTH,
  }

  componentDidMount() {
    this.resize()
    window.addEventListener("resize", this.debounceResize)
  }

  componentWillUnmount() {
    this.resize()
    window.removeEventListener("resize", this.debounceResize)
  }

  resize = () => {
    if(
      this.widthRef.current
      && this.widthRef.current.clientWidth > 0
    ) {
      this.setState({width: this.widthRef.current.clientWidth})
    }
  }

  debounceResize = () => {
    clearTimeout(this.timeout)
    this.timeout = window.setTimeout(
      () => this.resize(),
      100,
    )
  }

  render() {
    return (
      <div ref={this.widthRef}>
        <Component {...this.props} width={this.state.width}/>
      </div>
    );
  }
}
