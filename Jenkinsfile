pipeline {
  agent {
    node {
      label 'build'
    }

  }
  stages {
    stage('Install') {
      steps {
        sh 'yarn install'
      }
    }

    stage('Build') {
      steps {
        sh 'yarn build:prod'
      }
    }

    stage('Unit tests') {
      steps {
        sh 'yarn test:unit'
      }
    }

    stage('Integration tests') {
      steps {
        sh 'yarn test:integration'
      }
    }

    stage('Static code analysis') {
      steps {
        sh 'sonar-scanner -Dsonar.login=""'
      }
    }

    stage('Docker') {
      steps {
        sh 'docker login -u "" -p "" amrita-elective.tk:5000'
        sh 'docker build -t amrita-elective.tk:5000/api .'
        sh 'docker push amrita-elective.tk:5000/api'
      }
    }

  }
}