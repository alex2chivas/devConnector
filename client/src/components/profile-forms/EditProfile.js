import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import { compose } from 'redux'
import { Link, withRouter } from 'react-router-dom'
import { checkComponent, fields } from '../formFields/createProfileField.js'
import { socialOptions, socialInput } from '../formFields/socialMediaFields'
import * as uuid from 'uuid'

import { createProfile, getCurrentProfile } from '../../actions'

const editFields = () => {
  return fields.map(({ name, type, label, text }) => {
    return (
      <Field
        key={`${uuid.v4}_${name}`}
        name={name}
        type={type}
        label={label}
        text={text}
        component={checkComponent(type)}
      />
    )
  })
}

const SocialMedia = () => {
  return socialOptions.map(({ name, type, label, clas }) => {
    return (
      <Field
        key={`${uuid.v5}_${label}`}
        name={name}
        type={type}
        label={label}
        clas={clas}
        component={socialInput}
      />
    )
  })
}

const EditProfile = ({ handleSubmit, createProfile, history }) => {
  const [displaySocialInputs, toggleSocialInputs] = useState(false)

  const onSubmit = values => {
    createProfile(values, history, true)
  }

  return (
    <React.Fragment>
      <form className='form' onSubmit={handleSubmit(onSubmit)}>
        {editFields()}
        <div className='my-2'>
          <button
            onClick={() => toggleSocialInputs(!displaySocialInputs)}
            type='button'
            className='btn btn-light'
          >
            Add Social Network Links
          </button>
          <span>Optional</span>
        </div>
        {displaySocialInputs && (
          <React.Fragment>{SocialMedia()}</React.Fragment>
        )}

        <input type='submit' className='btn btn-primary my-1' />
        <Link className='btn btn-light my-1' to='/dashboard'>
          Go Back
        </Link>
      </form>
    </React.Fragment>
  )
}

EditProfile.propTypes = {
  createProfile: PropTypes.func.isRequired,
  getCurrentProfile: PropTypes.func.isRequired
}

export default compose(
  reduxForm({
    form: 'EditProfileForm',
    destroyOnUnmount: true
  }),
  connect(null, { createProfile, getCurrentProfile })
)(withRouter(EditProfile))
